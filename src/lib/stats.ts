/**
 * Stats calculation utilities library
 * Per PLAN 06-03 requirements: incremental average updates, weighted overall calculation
 */

/**
 * Parse a Drizzle decimal string to number
 * Handles null/undefined → returns 0
 */
export function parseDecimal(value: string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate incremental average
 * Formula: ((oldAverage * oldCount) + newValue) / (oldCount + 1)
 *
 * @param oldAverage - Current average value
 * @param oldCount - Number of data points that produced oldAverage
 * @param newValue - New value to incorporate
 * @returns New average rounded to 2 decimal places
 *
 * @example
 * calculateIncrementalAverage(3.5, 10, 4) // 3.59
 * calculateIncrementalAverage(3.0, 0, 5) // 5.00
 */
export function calculateIncrementalAverage(
  oldAverage: number,
  oldCount: number,
  newValue: number
): number {
  if (oldCount === 0) {
    return Math.round(newValue * 100) / 100;
  }

  const newAverage = (oldAverage * oldCount + newValue) / (oldCount + 1);
  return Math.round(newAverage * 100) / 100;
}

/**
 * Calculate weighted overall score from three axes
 * Formula: (technique * 0.4) + (physique * 0.3) + (collectif * 0.3)
 *
 * @param technique - Technical ability score (1-5)
 * @param physique - Physical ability score (1-5)
 * @param collectif - Collective/teamwork score (1-5)
 * @returns Weighted overall score rounded to 2 decimal places
 *
 * @example
 * calculateWeightedOverall(4.0, 3.5, 3.8) // 3.79
 * calculateWeightedOverall(5.0, 5.0, 5.0) // 5.00
 */
export function calculateWeightedOverall(
  technique: number,
  physique: number,
  collectif: number
): number {
  const overall = technique * 0.4 + physique * 0.3 + collectif * 0.3;
  return Math.round(overall * 100) / 100;
}

/**
 * Update player stats from a batch of new ratings
 * Aggregates multiple ratings and applies incremental formula
 *
 * @param ratings - Array of new ratings with technique, physique, collectif
 * @param currentStats - Current player stats from database
 * @returns Updated stats object with all fields as strings (2 decimal places)
 *
 * Process:
 * 1. Average new ratings per axis
 * 2. Apply incremental formula: new_avg = ((old_avg * n) + avg_new) / (n + 1)
 * 3. Calculate weighted overall from new three-axis averages
 * 4. Increment totalRatingsReceived by ratings.length
 */
export function updatePlayerStatsFromRatings(
  ratings: Array<{ technique: number; physique: number; collectif: number }>,
  currentStats: {
    avgTechnique: string | null;
    avgPhysique: string | null;
    avgCollectif: string | null;
    totalRatingsReceived: number;
  }
): {
  avgTechnique: string;
  avgPhysique: string;
  avgCollectif: string;
  avgOverall: string;
  totalRatingsReceived: number;
} {
  // Parse current stats
  const oldAvgTechnique = parseDecimal(currentStats.avgTechnique);
  const oldAvgPhysique = parseDecimal(currentStats.avgPhysique);
  const oldAvgCollectif = parseDecimal(currentStats.avgCollectif);
  const oldCount = currentStats.totalRatingsReceived;

  // Calculate average of new ratings per axis
  const avgNewTechnique =
    ratings.reduce((sum, r) => sum + r.technique, 0) / ratings.length;
  const avgNewPhysique =
    ratings.reduce((sum, r) => sum + r.physique, 0) / ratings.length;
  const avgNewCollectif =
    ratings.reduce((sum, r) => sum + r.collectif, 0) / ratings.length;

  // Apply incremental formula: treat the batch as a single data point
  // ((old_avg * old_count) + avg_new * batch_size) / (old_count + batch_size)
  const newCount = oldCount + ratings.length;
  const newAvgTechnique =
    (oldAvgTechnique * oldCount + avgNewTechnique * ratings.length) / newCount;
  const newAvgPhysique =
    (oldAvgPhysique * oldCount + avgNewPhysique * ratings.length) / newCount;
  const newAvgCollectif =
    (oldAvgCollectif * oldCount + avgNewCollectif * ratings.length) / newCount;

  // Calculate weighted overall from new three-axis averages
  const newAvgOverall = calculateWeightedOverall(
    newAvgTechnique,
    newAvgPhysique,
    newAvgCollectif
  );

  // Format as strings with 2 decimal places
  return {
    avgTechnique: newAvgTechnique.toFixed(2),
    avgPhysique: newAvgPhysique.toFixed(2),
    avgCollectif: newAvgCollectif.toFixed(2),
    avgOverall: newAvgOverall.toFixed(2),
    totalRatingsReceived: newCount,
  };
}

/**
 * Recalculate player stats from database
 * Used after guest merge, match closure, rating submissions
 * Per CONTEXT.md D-15: Core data only merge (match_players and ratings)
 *
 * @param userId - The user ID to recalculate stats for
 * @param groupId - Optional group ID to limit recalculation to specific group
 */
export async function recalculatePlayerStats(
  userId: string,
  groupId?: string
): Promise<void> {
  const { db } = await import('@/db');
  const { matchPlayers, ratings, playerStats } = await import('@/db/schema');
  const { eq, and, sql } = await import('drizzle-orm');

  // Build where condition for match_players (no groupId on matchPlayers table)
  const whereCondition = eq(matchPlayers.userId, userId);

  // Count matches played, attended, no-show
  const statsResult = await db
    .select({
      matchesPlayed: sql<number>`count(*)::int`,
      matchesAttended: sql<number>`count(*) filter (where ${matchPlayers.attended} = true)::int`,
      matchesNoShow: sql<number>`count(*) filter (where ${matchPlayers.status} = 'no_show')::int`,
    })
    .from(matchPlayers)
    .where(whereCondition);

  const stats = statsResult[0] || { matchesPlayed: 0, matchesAttended: 0, matchesNoShow: 0 };

  // Get average ratings
  const ratingsAvgResult = await db
    .select({
      avgTechnique: sql<string>`avg(${ratings.technique})::text`,
      avgPhysique: sql<string>`avg(${ratings.physique})::text`,
      avgCollectif: sql<string>`avg(${ratings.collectif})::text`,
    })
    .from(ratings)
    .where(eq(ratings.ratedId, userId));

  const ratingsAvg = ratingsAvgResult[0];

  const avgTechnique = parseDecimal(ratingsAvg?.avgTechnique);
  const avgPhysique = parseDecimal(ratingsAvg?.avgPhysique);
  const avgCollectif = parseDecimal(ratingsAvg?.avgCollectif);

  // Calculate weighted overall: technique * 0.4 + physique * 0.3 + collectif * 0.3
  const avgOverall = calculateWeightedOverall(avgTechnique, avgPhysique, avgCollectif);

  const attendanceRate = stats.matchesPlayed > 0
    ? (stats.matchesAttended / stats.matchesPlayed) * 100
    : 0;

  // Get last match date
  const lastMatchDataResult = await db
    .select({
      lastMatchDate: sql<Date>`max(${matchPlayers.confirmedAt})`,
    })
    .from(matchPlayers)
    .where(eq(matchPlayers.userId, userId));

  const lastMatchData = lastMatchDataResult[0];

  // Count total ratings received
  const ratingCountResult = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(ratings)
    .where(eq(ratings.ratedId, userId));

  const ratingCount = ratingCountResult[0]?.count || 0;

  // Upsert player_stats
  await db
    .insert(playerStats)
    .values({
      userId,
      groupId: groupId || null,
      matchesPlayed: stats.matchesPlayed,
      matchesConfirmed: stats.matchesPlayed, // Assumption: confirmed = played for now
      matchesAttended: stats.matchesAttended,
      matchesNoShow: stats.matchesNoShow,
      attendanceRate: attendanceRate.toFixed(2),
      avgTechnique: avgTechnique.toFixed(2),
      avgPhysique: avgPhysique.toFixed(2),
      avgCollectif: avgCollectif.toFixed(2),
      avgOverall: avgOverall.toFixed(2),
      totalRatingsReceived: ratingCount,
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
        totalRatingsReceived: ratingCount,
        lastMatchDate: lastMatchData?.lastMatchDate,
        lastUpdated: new Date(),
      },
    });
}
