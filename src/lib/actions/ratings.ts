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
  updatePlayerStats,
  countDistinctRaters,
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

    // Insert ratings and update stats in transaction
    await db.transaction(async (tx) => {
      // Insert new ratings
      await insertRatings(input.matchId, raterId, newRatings);

      // Update stats for each rated player
      const ratingsByPlayer = new Map<string, Array<typeof newRatings[0]>>();

      for (const rating of newRatings) {
        if (!ratingsByPlayer.has(rating.ratedId)) {
          ratingsByPlayer.set(rating.ratedId, []);
        }
        ratingsByPlayer.get(rating.ratedId)!.push(rating);
      }

      for (const [ratedId, playerRatings] of ratingsByPlayer) {
        await updatePlayerStats(ratedId, input.matchId, playerRatings);
      }
    });

    // Check if match should be marked "rated" (50% threshold)
    const [confirmedCountResult] = await db
      .select({ count: count() })
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, input.matchId),
          eq(matchPlayers.attended, true)
        )
      );

    const confirmedCount = confirmedCountResult?.count || 0;
    const ratersCount = await countDistinctRaters(input.matchId);
    const threshold = Math.ceil(confirmedCount / 2);

    if (ratersCount >= threshold && match.status !== "rated") {
      // Update match status to "rated"
      await db
        .update(matches)
        .set({ status: "rated", updatedAt: new Date() })
        .where(eq(matches.id, input.matchId));
    }

    // Revalidate paths
    revalidatePath(`/match/${input.matchId}`);
    revalidatePath(`/match/${input.matchId}/rate`);
    if (match.shareToken) {
      revalidatePath(`/m/${match.shareToken}/rate`);
    }

    return {
      success: true,
      matchId: input.matchId,
      ratingsCount: newRatings.length,
      totalRaters: ratersCount,
      matchRated: ratersCount >= threshold,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Données invalides" };
    }
    console.error("Submit ratings error:", error);
    return { error: "Erreur lors de l'envoi des notes" };
  }
}
