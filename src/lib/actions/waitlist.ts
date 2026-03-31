"use server";

import { db } from "@/db";
import { matches, matchPlayers, users } from "@/db/schema";
import { eq, sql, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendWaitlistPromotionEmail } from "@/lib/utils/emails";

/**
 * Promote the first waitlisted player to confirmed status
 * Uses transaction with row locking to prevent race conditions
 *
 * CRITICAL: Coordinates with 02-02 RSVP operations (rsvpMatch)
 * - Both modify match.status, so FOR UPDATE locking is required
 * - Transaction re-checks confirmed count after lock to handle race conditions
 *
 * @param matchId - The match ID to promote waitlisted player for
 * @returns Object with success status and promoted player info
 *
 * Per CONTEXT.md WAIT-01: "When confirmed player cancels, first waitlisted player auto-promotes"
 * Per RESEARCH.md waitlist logic: FIFO ordering via confirmedAt ASC
 */
export async function promoteFirstWaitlisted(matchId: string) {
  try {
    const result = await db.transaction(async (tx) => {
      // CRITICAL: Lock match row with FOR UPDATE to serialize with concurrent RSVP operations
      const [lockedMatch] = await tx
        .select()
        .from(matches)
        .where(eq(matches.id, matchId))
        .for("update");

      if (!lockedMatch) {
        throw new Error("Match not found");
      }

      // Find first waitlisted player (earliest confirmedAt = FIFO)
      const [waitlistedPlayer] = await tx
        .select()
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, matchId),
            eq(matchPlayers.status, "waitlisted")
          )
        )
        .orderBy(asc(matchPlayers.confirmedAt))
        .limit(1);

      // If no waitlisted players, return early
      if (!waitlistedPlayer) {
        return { success: true, promotedPlayer: null };
      }

      // Update player status from "waitlisted" to "confirmed"
      const [updatedPlayer] = await tx
        .update(matchPlayers)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .where(eq(matchPlayers.id, waitlistedPlayer.id))
        .returning();

      if (!updatedPlayer) {
        throw new Error("Failed to promote player");
      }

      // Re-check confirmed count AFTER acquiring lock (handles race conditions)
      const [confirmedCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, matchId),
            eq(matchPlayers.status, "confirmed")
          )
        );

      const confirmedCountValue = confirmedCount?.count ?? 0;

      // Update match status to "full" if now at capacity
      if (confirmedCountValue >= lockedMatch.maxPlayers) {
        await tx
          .update(matches)
          .set({ status: "full" })
          .where(eq(matches.id, matchId));
      }

      return {
        success: true,
        promotedPlayer: {
          id: updatedPlayer.id,
          guestName: updatedPlayer.guestName,
          newPosition: confirmedCountValue,
        },
      };
    });

    // Send waitlist promotion email if promoted player has user account
    // Per plan 10-02 Task 7: Integrate waitlist promotion email into RSVP flow
    if (result.promotedPlayer) {
      // Fetch the updated player to get userId for email sending
      const [promotedPlayerDetails] = await db
        .select()
        .from(matchPlayers)
        .where(eq(matchPlayers.id, result.promotedPlayer.id))
        .limit(1);

      if (promotedPlayerDetails) {
        try {
          // Fetch user details if userId exists (registered user)
          if (promotedPlayerDetails.userId) {
            const [user] = await db
              .select({ name: users.name, email: users.email })
              .from(users)
              .where(eq(users.id, promotedPlayerDetails.userId))
              .limit(1);

            if (user) {
              // Fetch match details for email
              const [match] = await db
                .select({ title: matches.title, date: matches.date, location: matches.location, shareToken: matches.shareToken })
                .from(matches)
                .where(eq(matches.id, matchId))
                .limit(1);

              if (match) {
                await sendWaitlistPromotionEmail(
                  promotedPlayerDetails.userId,
                  user.name,
                  user.email,
                  match.title,
                  match.date,
                  match.location,
                  match.shareToken
                );
              }
            }
          } else if (promotedPlayerDetails.guestName && promotedPlayerDetails.guestToken) {
            // Guest without account — skip email (no email address)
            console.log(`Guest ${promotedPlayerDetails.guestName} promoted (no email sent)`);
          }
        } catch (emailError) {
          // Log but don't fail the promotion
          console.error('Failed to send waitlist promotion email:', emailError);
        }
      }
    }

    // Revalidate the public match page
    // Need to fetch match for shareToken
    const match = await db
      .select({ shareToken: matches.shareToken })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (match[0]?.shareToken) {
      revalidatePath(`/m/${match[0].shareToken}`);
    }

    return result;
  } catch (error) {
    console.error("Promote waitlisted error:", error);
    return { success: false, error: "Erreur lors de la promotion" };
  }
}

/**
 * Get waitlist position for a guest
 * Returns 1-indexed position (first waitlisted = position 1)
 *
 * @param matchId - The match ID
 * @param guestToken - The guest token to check position for
 * @returns Object with position (0 if not waitlisted)
 */
export async function getWaitlistPosition(
  matchId: string,
  guestToken: string
) {
  try {
    // Get the player's confirmedAt timestamp
    const [player] = await db
      .select({ confirmedAt: matchPlayers.confirmedAt })
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, matchId),
          eq(matchPlayers.guestToken, guestToken),
          eq(matchPlayers.status, "waitlisted")
        )
      )
      .limit(1);

    if (!player) {
      return { position: 0 };
    }

    // Count waitlisted players with earlier confirmedAt
    const [earlierCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, matchId),
          eq(matchPlayers.status, "waitlisted"),
          sql`${matchPlayers.confirmedAt} < ${player.confirmedAt}`
        )
      );

    // Position = count of earlier players + 1 (1-indexed)
    return { position: (earlierCount?.count ?? 0) + 1 };
  } catch (error) {
    console.error("Get waitlist position error:", error);
    return { position: 0 };
  }
}
