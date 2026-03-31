"use server";

import { z } from "zod";
import { db } from "@/db";
import { matches, matchPlayers } from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { ratingSchema } from "@/lib/validations/rating";
import {
  getMatchPlayersForRating,
  getExistingRatings,
  insertRatings,
  createOrUpdatePlayerStats,
  updateMatchRatedStatus,
} from "@/lib/db/queries/ratings";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";

const GUEST_TOKEN_COOKIE = "guest_token";

/**
 * Submit ratings for a match
 * Per PLAN 06-01 requirements: RATE-01 through RATE-07
 * Handles both authenticated users (session) and guests (cookie)
 */
export async function submitRatings(formData: FormData) {
  try {
    // Determine raterId from session or guest cookie
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let raterId: string;
    let isGuest = false;

    if (session?.user?.id) {
      // Authenticated user
      raterId = session.user.id;
    } else {
      // Guest: read from cookie
      const cookieStore = await cookies();
      const guestToken = cookieStore.get(GUEST_TOKEN_COOKIE)?.value;

      if (!guestToken) {
        return { error: "Non authentifié" };
      }

      raterId = guestToken;
      isGuest = true;
    }

    // Parse and validate input
    const input = ratingSchema.parse({
      matchId: formData.get("matchId"),
      ratings: JSON.parse(formData.get("ratings") as string),
    });

    // Get match and verify status is "played"
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, input.matchId))
      .limit(1);

    if (!match) {
      return { error: "Match non trouvé" };
    }

    if (match.status !== "played" && match.status !== "rated") {
      return { error: "Ce match n'est pas encore terminé" };
    }

    // Verify rater participated in match and attended=true
    const [raterRecord] = await db
      .select()
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, input.matchId),
          isGuest
            ? eq(matchPlayers.guestToken, raterId)
            : eq(matchPlayers.userId, raterId),
          eq(matchPlayers.attended, true)
        )
      )
      .limit(1);

    if (!raterRecord) {
      return { error: "Tu n'étais pas présent à ce match" };
    }

    // Check for existing ratings (idempotent)
    const existingRatings = await getExistingRatings(input.matchId, raterId);
    const existingRatedIds = new Set(existingRatings.map((r) => r.ratedId));

    // Filter out already-rated players (idempotent behavior)
    const newRatings = input.ratings.filter(
      (r) => !existingRatedIds.has(r.ratedId)
    );

    if (newRatings.length === 0) {
      return { error: "Tu as déjà noté tous ces joueurs" };
    }

    // Group ratings by ratedId before transaction
    // Per PLAN 06-03 Task 3: ratingsByPlayer groups all ratings for each player
    const ratingsByPlayer = new Map<string, Array<typeof newRatings[0]>>();

    for (const rating of newRatings) {
      if (!ratingsByPlayer.has(rating.ratedId)) {
        ratingsByPlayer.set(rating.ratedId, []);
      }
      ratingsByPlayer.get(rating.ratedId)!.push(rating);
    }

    // Insert ratings and update stats in transaction
    // Per PLAN 06-03 Task 3: call createOrUpdatePlayerStats, updateMatchRatedStatus
    let matchStatusUpdated = false;

    await db.transaction(async (tx) => {
      // Insert new ratings
      await insertRatings(input.matchId, raterId, newRatings);

      // Update stats for each rated player
      // Per PLAN 06-03 Task 3: call createOrUpdatePlayerStats for each player
      for (const [ratedId, playerRatings] of ratingsByPlayer) {
        try {
          // Determine groupId from match
          const groupId = match.groupId || null;

          // Call createOrUpdatePlayerStats (handles both create and update)
          await createOrUpdatePlayerStats(ratedId, groupId, playerRatings);

          console.log(`Updated stats for ${ratedId} (${playerRatings.length} ratings)`);
        } catch (error) {
          // Log but don't fail transaction (ratings are primary)
          console.error(`Failed to update stats for ${ratedId}:`, error);
        }
      }

      // Update match status to "rated" if threshold reached
      // Per PLAN 06-03 Task 3: call updateMatchRatedStatus after stats updated
      matchStatusUpdated = await updateMatchRatedStatus(input.matchId, tx);

      if (matchStatusUpdated) {
        console.log(`Match ${input.matchId} status updated to 'rated'`);
      }
    });

    // Revalidate paths
    // Per PLAN 06-03 Task 3: add /player/{ratedId} for each rated player (future-proofing)
    revalidatePath(`/match/${input.matchId}`);
    revalidatePath(`/match/${input.matchId}/rate`);
    if (match.shareToken) {
      revalidatePath(`/m/${match.shareToken}/rate`);
    }

    // Revalidate player profile paths for future Phase 7
    for (const ratedId of ratingsByPlayer.keys()) {
      revalidatePath(`/player/${ratedId}`);
    }

    return {
      success: true,
      matchId: input.matchId,
      ratingsCount: newRatings.length,
      matchStatusUpdated, // Per PLAN 06-03 Task 3: indicates if match changed to "rated"
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Données invalides" };
    }
    console.error("Submit ratings error:", error);
    return { error: "Erreur lors de l'envoi des notes" };
  }
}
