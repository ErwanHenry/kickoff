import { db } from '@/db';
import { matchPlayers, ratings, playerStats } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getGuestToken, deleteGuestToken } from '@/lib/cookies';
import { recalculatePlayerStats } from '@/lib/stats';

export interface MergeResult {
  success: boolean;
  matchesMerged: number;
  ratingsGivenMerged: number;
  ratingsReceivedMerged: number;
  error?: string;
}

/**
 * Merge guest data to user account when guest creates an account
 * Per CONTEXT.md D-15 through D-18:
 * - Updates match_players (RSVPs) with new user_id
 * - Updates ratings (given and received) with new user_id
 * - Recalculates player_stats
 * - Deletes guest_token cookie
 * - Uses transaction for atomicity
 *
 * @param userId - The newly created user ID to merge guest data into
 * @returns MergeResult with counts of merged data
 */
export async function mergeGuestToUser(userId: string): Promise<MergeResult> {
  const guestToken = await getGuestToken();

  // No guest token — normal registration, no merge needed (D-17)
  if (!guestToken) {
    return {
      success: true,
      matchesMerged: 0,
      ratingsGivenMerged: 0,
      ratingsReceivedMerged: 0,
    };
  }

  try {
    // Transactional merge (D-16, D-17)
    const result = await db.transaction(async (tx) => {
      // Step 1: Update match_players — transfer ownership to user
      const updatedPlayers = await tx
        .update(matchPlayers)
        .set({
          userId,
          guestName: null,
          guestToken: null,
        })
        .where(eq(matchPlayers.guestToken, guestToken))
        .returning({ matchId: matchPlayers.matchId });

      const matchesMerged = updatedPlayers.length;

      // Step 2: Update ratings where guest_token is rater (ratings given)
      const ratingsGiven = await tx
        .update(ratings)
        .set({ raterId: userId })
        .where(eq(ratings.raterId, guestToken))
        .returning({ matchId: ratings.matchId });

      const ratingsGivenMerged = ratingsGiven.length;

      // Step 3: Update ratings where guest_token is rated (ratings received)
      const ratingsReceived = await tx
        .update(ratings)
        .set({ ratedId: userId })
        .where(eq(ratings.ratedId, guestToken))
        .returning({ matchId: ratings.matchId });

      const ratingsReceivedMerged = ratingsReceived.length;

      // Step 4: Collect all unique match IDs for stats recalculation
      const allMatchIds = new Set<string>();
      updatedPlayers.forEach(p => allMatchIds.add(p.matchId));
      ratingsGiven.forEach(r => allMatchIds.add(r.matchId));
      ratingsReceived.forEach(r => allMatchIds.add(r.matchId));

      return {
        matchesMerged,
        ratingsGivenMerged,
        ratingsReceivedMerged,
        affectedMatchIds: Array.from(allMatchIds),
      };
    });

    // Step 5: Recalculate player_stats (outside transaction, but logged)
    // For a new user, this creates initial stats based on merged data
    // We call recalculatePlayerStats once for all matches (global stats)
    try {
      await recalculatePlayerStats(userId);
    } catch (statsError) {
      console.error(`Failed to recalculate stats for user ${userId}:`, statsError);
    }

    // Step 6: Delete guest_token cookie (D-18)
    await deleteGuestToken();

    console.log(`Successfully merged guest ${guestToken} to user ${userId}:`, {
      matches: result.matchesMerged,
      ratingsGiven: result.ratingsGivenMerged,
      ratingsReceived: result.ratingsReceivedMerged,
    });

    return {
      success: true,
      matchesMerged: result.matchesMerged,
      ratingsGivenMerged: result.ratingsGivenMerged,
      ratingsReceivedMerged: result.ratingsReceivedMerged,
    };
  } catch (error) {
    console.error(`Failed to merge guest ${guestToken} to user ${userId}:`, error);
    return {
      success: false,
      matchesMerged: 0,
      ratingsGivenMerged: 0,
      ratingsReceivedMerged: 0,
      error: String(error),
    };
  }
}
