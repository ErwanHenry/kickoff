"use server";

import { z } from "zod";
import { db } from "@/db";
import { matches, matchPlayers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { generateGuestToken } from "@/lib/utils/ids";
import { setGuestToken } from "@/lib/cookies";
import { revalidatePath } from "next/cache";

const rsvpSchema = z.object({
  shareToken: z.string().length(10),
  guestName: z.string().min(1).max(50),
});

const cancelSchema = z.object({
  shareToken: z.string().length(10),
  guestToken: z.string().length(10),
});

/**
 * RSVP for a match as a guest
 * Uses transaction with row locking to prevent race conditions
 * - Confirms spot if available
 * - Adds to waitlist if full
 * - Updates match status to "full" when max reached (WAIT-04)
 */
export async function rsvpMatch(formData: FormData) {
  try {
    const shareToken = formData.get("shareToken") as string;
    const guestName = formData.get("guestName") as string;

    // Validate input
    const input = rsvpSchema.parse({ shareToken, guestName });

    // Generate guest token
    const guestToken = generateGuestToken();

    // Get match by share token
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.shareToken, input.shareToken))
      .limit(1);

    if (!match[0]) {
      return { error: "Match non trouvé" };
    }

    const matchData = match[0];

    // Check match status (prevent RSVP for locked/played/rated matches)
    if (matchData.status === "locked" || matchData.status === "played" || matchData.status === "rated") {
      return { error: "Ce match est verrouillé" };
    }

    // CRITICAL: Use transaction to prevent race conditions (Pitfall 1)
    const result = await db.transaction(async (tx) => {
      // Lock match row with FOR UPDATE to serialize concurrent RSVPs
      const [lockedMatch] = await tx
        .select()
        .from(matches)
        .where(eq(matches.id, matchData.id))
        .for("update");

      if (!lockedMatch) {
        throw new Error("Match not found");
      }

      // Count confirmed players in transaction (accurate count)
      const [confirmedCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, matchData.id),
            eq(matchPlayers.status, "confirmed")
          )
        );

      // Determine if match is full
      const confirmedCountValue = confirmedCount?.count ?? 0;
      const isFull = confirmedCountValue >= lockedMatch.maxPlayers;

      // Insert player with appropriate status
      const players = await tx
        .insert(matchPlayers)
        .values({
          matchId: matchData.id,
          guestName: input.guestName,
          guestToken,
          status: isFull ? "waitlisted" : "confirmed",
        })
        .returning();

      const player = players[0];
      if (!player) {
        throw new Error("Failed to insert player");
      }

      if (isFull) {
        // Calculate waitlist position
        const [waitlistPosition] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(matchPlayers)
          .where(
            and(
              eq(matchPlayers.matchId, matchData.id),
              eq(matchPlayers.status, "waitlisted")
            )
          );

        return { player, waitlistPosition: (waitlistPosition?.count ?? 0) + 1, isFull: true };
      }

      // Update match status to "full" if now at capacity (WAIT-04)
      if (confirmedCountValue + 1 >= lockedMatch.maxPlayers) {
        await tx
          .update(matches)
          .set({ status: "full" })
          .where(eq(matches.id, matchData.id));
      }

      return { player, waitlistPosition: null, isFull: false };
    });

    // Set httpOnly cookie for 30-day persistence (GUEST-03)
    await setGuestToken(guestToken);

    // Revalidate page to show updated state
    revalidatePath(`/m/${input.shareToken}`);

    return {
      success: true,
      guestToken,
      status: result.player.status,
      waitlistPosition: result.waitlistPosition,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Données invalides" };
    }
    console.error("RSVP error:", error);
    return { error: "Erreur lors de l'inscription" };
  }
}

/**
 * Cancel RSVP for a guest
 * - Updates player status to "cancelled"
 * - Changes match status from "full" to "open" if spot freed (WAIT-03)
 * - Cookie preserved for re-RSVP
 */
export async function cancelRsvp(formData: FormData) {
  try {
    const shareToken = formData.get("shareToken") as string;
    const guestToken = formData.get("guestToken") as string;

    // Validate input
    const input = cancelSchema.parse({ shareToken, guestToken });

    // Get match by share token
    const match = await db
      .select()
      .from(matches)
      .where(eq(matches.shareToken, input.shareToken))
      .limit(1);

    if (!match[0]) {
      return { error: "Match non trouvé" };
    }

    const matchData = match[0];

    // Find the player by guest token
    const player = await db
      .select()
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, matchData.id),
          eq(matchPlayers.guestToken, input.guestToken)
        )
      )
      .limit(1);

    if (!player[0]) {
      return { error: "Inscription non trouvée" };
    }

    // Update player status to cancelled
    await db
      .update(matchPlayers)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
      })
      .where(eq(matchPlayers.id, player[0].id));

    // Check if match was full and has waitlist
    if (matchData.status === "full") {
      const [waitlistCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, matchData.id),
            eq(matchPlayers.status, "waitlisted")
          )
        );

      if ((waitlistCount?.count ?? 0) > 0) {
        // Change match status from "full" to "open" (WAIT-03)
        await db
          .update(matches)
          .set({ status: "open" })
          .where(eq(matches.id, matchData.id));
      }
    }

    // Revalidate page to show updated state
    revalidatePath(`/m/${input.shareToken}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Données invalides" };
    }
    console.error("Cancel RSVP error:", error);
    return { error: "Erreur lors de l'annulation" };
  }
}
