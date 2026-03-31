import { db } from '@/db';
import { matchPlayers, ratings, playerStats } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getGuestToken, deleteGuestToken } from '@/lib/cookies';
import { parseDecimal } from '@/lib/stats';

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
    for (const matchId of result.affectedMatchIds) {
      try {
        await recalculatePlayerStats(userId, matchId);
      } catch (statsError) {
        console.error(`Failed to recalculate stats for user ${userId}, match ${matchId}:`, statsError);
      }
    }

    // Also calculate global stats (all matches, not per-match)
    try {
      await recalculatePlayerStats(userId);
    } catch (statsError) {
      console.error(`Failed to recalculate global stats for user ${userId}:`, statsError);
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

/**
 * Recalculate player stats from match_players and ratings data
 * Used after guest merge, match closure, rating submissions
 *
 * Per CONTEXT.md D-15: Core data only merge (match_players and ratings)
 * This function aggregates all data and computes accurate stats
 *
 * @param userId - The user ID to recalculate stats for
 * @param matchId - Optional match ID to limit recalculation to specific match
 */
async function recalculatePlayerStats(userId: string, matchId?: string): Promise<void> {
  // Build where condition
  const whereCondition = matchId
    ? and(eq(matchPlayers.userId, userId), eq(matchPlayers.matchId, matchId))
    : eq(matchPlayers.userId, userId);

  // Count matches played, attended, no-show
  const [stats] = await db
    .select({
      matchesPlayed: sql<number>`count(*)::int`,
      matchesAttended: sql<number>`count(*) filter (where ${matchPlayers.attended} = true)::int`,
      matchesNoShow: sql<number>`count(*) filter (where ${matchPlayers.status} = 'no_show')::int`,
    })
    .from(matchPlayers)
    .where(whereCondition);

  // Get average ratings
  const [ratingsAvg] = await db
    .select({
      avgTechnique: sql<number>`avg(${ratings.technique})::text`,
      avgPhysique: sql<number>`avg(${ratings.physique})::text`,
      avgCollectif: sql<number>`avg(${ratings.collectif})::text`,
    })
    .from(ratings)
    .where(eq(ratings.ratedId, userId));

  const avgTechnique = parseDecimal(ratingsAvg?.avgTechnique);
  const avgPhysique = parseDecimal(ratingsAvg?.avgPhysique);
  const avgCollectif = parseDecimal(ratingsAvg?.avgCollectif);

  // Calculate weighted overall: technique * 0.4 + physique * 0.3 + collectif * 0.3
  const avgOverall = (avgTechnique * 0.4 + avgPhysique * 0.3 + avgCollectif * 0.3);

  const attendanceRate = stats.matchesPlayed > 0
    ? (stats.matchesAttended / stats.matchesPlayed) * 100
    : 0;

  // Get last match date
  const [lastMatchData] = await db
    .select({
      lastMatchDate: sql<Date>`max(${matchPlayers.confirmedAt})`,
    })
    .from(matchPlayers)
    .where(eq(matchPlayers.userId, userId));

  // Count total ratings received
  const [ratingCount] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(ratings)
    .where(eq(ratings.ratedId, userId));

  // Upsert player_stats
  await db
    .insert(playerStats)
    .values({
      userId,
      groupId: null, // Global stats (per-group stats handled separately)
      matchesPlayed: stats.matchesPlayed,
      matchesConfirmed: stats.matchesPlayed, // Assumption: confirmed = played for now
      matchesAttended: stats.matchesAttended,
      matchesNoShow: stats.matchesNoShow,
      attendanceRate: attendanceRate.toFixed(2),
      avgTechnique: avgTechnique.toFixed(2),
      avgPhysique: avgPhysique.toFixed(2),
      avgCollectif: avgCollectif.toFixed(2),
      avgOverall: avgOverall.toFixed(2),
      totalRatingsReceived: ratingCount.count,
      lastMatchDate: lastMatchData?.lastMatchDate,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [playerStats.userId, playerStats.groupId],
      set: {
        matchesPlayed: stats.matchesPlayed,
        matchesConfirmed: stats.matchesPlayed,
        matchesAttended: stats.matchesAttended,
        matchesNoShow: stats.matchesNoShow,
        attendanceRate: attendanceRate.toFixed(2),
        avgTechnique: avgTechnique.toFixed(2),
        avgPhysique: avgPhysique.toFixed(2),
        avgCollectif: avgCollectif.toFixed(2),
        avgOverall: avgOverall.toFixed(2),
        totalRatingsReceived: ratingCount.count,
        lastMatchDate: lastMatchData?.lastMatchDate,
        lastUpdated: new Date(),
      },
    });
}
