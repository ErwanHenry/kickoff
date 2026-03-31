import { db } from "@/db";
import { ratings, matchPlayers, users, playerStats, matches } from "@/db/schema";
import { eq, and, sql, count, desc } from "drizzle-orm";
import {
  updatePlayerStatsFromRatings,
  parseDecimal,
} from "@/lib/stats";

/**
 * Get a match by shareToken
 * Returns match with basic info for rating page access control
 * Returns null if not found
 */
export async function getMatchByShareToken(shareToken: string) {
  const [match] = await db
    .select({
      id: matches.id,
      title: matches.title,
      date: matches.date,
      location: matches.location,
      status: matches.status,
      shareToken: matches.shareToken,
      groupId: matches.groupId,
    })
    .from(matches)
    .where(eq(matches.shareToken, shareToken))
    .limit(1);

  return match || null;
}

/**
 * Verify match status is "played" or "rated"
 * Returns true if match can be rated, false otherwise
 */
export function verifyMatchPlayed(match: { status: string }): boolean {
  return match.status === "played" || match.status === "rated";
}

/**
 * Get all players from a match that the rater can rate
 * Excludes the rater themselves and only includes players who attended=true
 * Returns player info with names and avatars (initials)
 */
export async function getMatchPlayersForRating(matchId: string, raterId: string) {
  return db
    .select({
      id: sql<string>`COALESCE(${matchPlayers.userId}, ${matchPlayers.guestToken})`.as("id"),
      name: sql<string>`COALESCE(${users.name}, ${matchPlayers.guestName})`,
      userId: matchPlayers.userId,
      guestToken: matchPlayers.guestToken,
    })
    .from(matchPlayers)
    .leftJoin(users, eq(matchPlayers.userId, users.id))
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.attended, true),
        // Exclude rater (whether user or guest)
        sql`(
          (${matchPlayers.userId} IS NOT NULL AND ${matchPlayers.userId} != ${raterId})
          OR
          (${matchPlayers.guestToken} IS NOT NULL AND ${matchPlayers.guestToken} != ${raterId})
          OR
          (${matchPlayers.userId} IS NULL AND ${matchPlayers.guestToken} IS NULL)
        )`
      )
    )
    .orderBy(matchPlayers.confirmedAt);
}

/**
 * Get all ratings already submitted by a rater for a match
 * Used to prevent duplicate ratings (idempotent check)
 */
export async function getExistingRatings(matchId: string, raterId: string) {
  const results = await db
    .select({
      ratedId: ratings.ratedId,
      technique: ratings.technique,
      physique: ratings.physique,
      collectif: ratings.collectif,
      comment: ratings.comment,
    })
    .from(ratings)
    .where(and(eq(ratings.matchId, matchId), eq(ratings.raterId, raterId)));

  // Transform null to undefined for comment
  return results.map((r) => ({
    ...r,
    comment: r.comment || undefined,
  }));
}

/**
 * Insert ratings transactionally
 * UNIQUE constraint on (match_id, rater_id, rated_id) prevents duplicates
 */
export async function insertRatings(
  matchId: string,
  raterId: string,
  newRatings: Array<{
    ratedId: string;
    technique: number;
    physique: number;
    collectif: number;
    comment?: string;
  }>
) {
  // Use a transaction to ensure all ratings are inserted or none
  return db.transaction(async (tx) => {
    const insertedRatings = await tx
      .insert(ratings)
      .values(
        newRatings.map((rating) => ({
          matchId,
          raterId,
          ratedId: rating.ratedId,
          technique: rating.technique,
          physique: rating.physique,
          collectif: rating.collectif,
          comment: rating.comment || null,
        }))
      )
      .onConflictDoNothing({
        target: [ratings.matchId, ratings.raterId, ratings.ratedId],
      })
      .returning();

    return insertedRatings;
  });
}

/**
 * Update player stats incrementally after receiving new ratings
 * Uses incremental average formula: new_avg = ((old_avg * n) + new_rating) / (n + 1)
 * Updates all three axes (technique, physique, collectif) and recalculates overall
 */
export async function updatePlayerStats(
  ratedId: string,
  matchId: string,
  newRatings: Array<{
    technique: number;
    physique: number;
    collectif: number;
  }>
) {
  // Get the match to find groupId for stats scoping
  const [match] = await db
    .select({ groupId: matches.groupId })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  const groupId = match?.groupId || null;

  // Calculate average of new ratings
  const avgTechnique =
    newRatings.reduce((sum, r) => sum + r.technique, 0) / newRatings.length;
  const avgPhysique =
    newRatings.reduce((sum, r) => sum + r.physique, 0) / newRatings.length;
  const avgCollectif =
    newRatings.reduce((sum, r) => sum + r.collectif, 0) / newRatings.length;

  // Fetch current stats
  const [currentStats] = await db
    .select()
    .from(playerStats)
    .where(
      and(
        eq(playerStats.userId, ratedId),
        groupId ? eq(playerStats.groupId, groupId) : sql`${playerStats.groupId} IS NULL`
      )
    )
    .limit(1);

  const totalRatings = currentStats?.totalRatingsReceived || 0;
  const newTotalRatings = totalRatings + newRatings.length;

  // Calculate incremental averages
  const oldAvgTechnique = Number(currentStats?.avgTechnique || 3.00);
  const oldAvgPhysique = Number(currentStats?.avgPhysique || 3.00);
  const oldAvgCollectif = Number(currentStats?.avgCollectif || 3.00);

  const newAvgTechnique =
    (oldAvgTechnique * totalRatings + avgTechnique * newRatings.length) / newTotalRatings;
  const newAvgPhysique =
    (oldAvgPhysique * totalRatings + avgPhysique * newRatings.length) / newTotalRatings;
  const newAvgCollectif =
    (oldAvgCollectif * totalRatings + avgCollectif * newRatings.length) / newTotalRatings;

  // Overall average: technique 40%, physique 30%, collectif 30%
  const newAvgOverall =
    newAvgTechnique * 0.4 + newAvgPhysique * 0.3 + newAvgCollectif * 0.3;

  // Update or insert player stats
  if (currentStats) {
    await db
      .update(playerStats)
      .set({
        avgTechnique: newAvgTechnique.toFixed(2),
        avgPhysique: newAvgPhysique.toFixed(2),
        avgCollectif: newAvgCollectif.toFixed(2),
        avgOverall: newAvgOverall.toFixed(2),
        totalRatingsReceived: newTotalRatings,
        lastUpdated: new Date(),
      })
      .where(
        and(
          eq(playerStats.userId, ratedId),
          groupId ? eq(playerStats.groupId, groupId) : sql`${playerStats.groupId} IS NULL`
        )
      );
  } else {
    await db.insert(playerStats).values({
      userId: ratedId,
      groupId,
      avgTechnique: newAvgTechnique.toFixed(2),
      avgPhysique: newAvgPhysique.toFixed(2),
      avgCollectif: newAvgCollectif.toFixed(2),
      avgOverall: newAvgOverall.toFixed(2),
      totalRatingsReceived: newRatings.length,
      lastUpdated: new Date(),
    });
  }

  return {
    avgTechnique: newAvgTechnique,
    avgPhysique: newAvgPhysique,
    avgCollectif: newAvgCollectif,
    avgOverall: newAvgOverall,
    totalRatingsReceived: newTotalRatings,
  };
}

/**
 * Count distinct raters for a match
 * Used to determine if match should be marked as "rated" (50% threshold)
 */
export async function countDistinctRaters(matchId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(ratings)
    .where(eq(ratings.matchId, matchId));

  return result?.count || 0;
}

/**
 * Get player stats by userId with optional groupId filter
 * Returns single record or null
 * Per PLAN 06-03 Task 2: fetch stats for rating updates
 */
export async function getPlayerStats(
  userId: string,
  groupId?: string
): Promise<typeof playerStats.$inferSelect | null> {
  const [stats] = await db
    .select()
    .from(playerStats)
    .where(
      and(
        eq(playerStats.userId, userId),
        groupId
          ? eq(playerStats.groupId, groupId)
          : sql`${playerStats.groupId} IS NULL`
      )
    )
    .limit(1);

  return stats || null;
}

/**
 * Create or update player stats from a batch of new ratings
 * Uses upsert pattern via Drizzle onConflictDoUpdate
 * Per PLAN 06-03 Task 2: handle both create and update cases atomically
 */
export async function createOrUpdatePlayerStats(
  userId: string,
  groupId: string | null,
  newRatings: Array<{ technique: number; physique: number; collectif: number }>
): Promise<typeof playerStats.$inferSelect> {
  // Check if stats record exists
  const existingStats = await getPlayerStats(userId, groupId || undefined);

  if (existingStats) {
    // Update existing stats using incremental formula
    const updatedStats = updatePlayerStatsFromRatings(newRatings, {
      avgTechnique: existingStats.avgTechnique,
      avgPhysique: existingStats.avgPhysique,
      avgCollectif: existingStats.avgCollectif,
      totalRatingsReceived: existingStats.totalRatingsReceived,
    });

    // Update database record
    await db
      .update(playerStats)
      .set({
        avgTechnique: updatedStats.avgTechnique,
        avgPhysique: updatedStats.avgPhysique,
        avgCollectif: updatedStats.avgCollectif,
        avgOverall: updatedStats.avgOverall,
        totalRatingsReceived: updatedStats.totalRatingsReceived,
        lastUpdated: new Date(),
      })
      .where(
        and(
          eq(playerStats.userId, userId),
          groupId
            ? eq(playerStats.groupId, groupId)
            : sql`${playerStats.groupId} IS NULL`
        )
      );

    // Return updated record
    const [updated] = await db
      .select()
      .from(playerStats)
      .where(
        and(
          eq(playerStats.userId, userId),
          groupId
            ? eq(playerStats.groupId, groupId)
            : sql`${playerStats.groupId} IS NULL`
        )
      )
      .limit(1);

    return updated!;
  } else {
    // Create new stats record from ratings
    const avgTechnique =
      newRatings.reduce((sum, r) => sum + r.technique, 0) / newRatings.length;
    const avgPhysique =
      newRatings.reduce((sum, r) => sum + r.physique, 0) / newRatings.length;
    const avgCollectif =
      newRatings.reduce((sum, r) => sum + r.collectif, 0) / newRatings.length;

    const avgOverall =
      avgTechnique * 0.4 + avgPhysique * 0.3 + avgCollectif * 0.3;

    const inserted = await db
      .insert(playerStats)
      .values({
        userId,
        groupId,
        avgTechnique: avgTechnique.toFixed(2),
        avgPhysique: avgPhysique.toFixed(2),
        avgCollectif: avgCollectif.toFixed(2),
        avgOverall: avgOverall.toFixed(2),
        totalRatingsReceived: newRatings.length,
        lastUpdated: new Date(),
      })
      .returning();

    // Insert always returns a record for non-conflicting insert
    if (!inserted[0]) {
      throw new Error("Failed to insert player stats");
    }
    return inserted[0];
  }
}

/**
 * Update match status to "rated" when 50%+ of confirmed players have rated
 * Per PLAN 06-03 Task 2: check 50% threshold and update status
 * @param matchId - Match ID to check and update
 * @param tx - Optional transaction instance for consistency
 * @returns true if status updated to "rated", false otherwise
 */
export async function updateMatchRatedStatus(
  matchId: string,
  tx?: any
): Promise<boolean> {
  const connection = tx || db;

  // Count distinct raters
  const [ratersResult] = await connection
    .select({ count: count() })
    .from(ratings)
    .where(eq(ratings.matchId, matchId));

  const ratersCount = ratersResult?.count || 0;

  // Count confirmed players who attended
  const [confirmedResult] = await connection
    .select({ count: count() })
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, "confirmed"),
        eq(matchPlayers.attended, true)
      )
    );

  const confirmedCount = confirmedResult?.count || 0;

  // Check if 50% threshold reached
  if (confirmedCount > 0 && ratersCount / confirmedCount >= 0.5) {
    // Update match status to "rated"
    await connection
      .update(matches)
      .set({ status: "rated", updatedAt: new Date() })
      .where(eq(matches.id, matchId));

    return true;
  }

  return false;
}

/**
 * Get match raters count
 * Per PLAN 06-03 Task 2: count distinct rater_ids for progress indicator
 */
export async function getMatchRatersCount(matchId: string): Promise<number> {
  return countDistinctRaters(matchId);
}

/**
 * Get match confirmed players count (attended=true)
 * Per PLAN 06-03 Task 2: count for 50% threshold calculation
 */
export async function getMatchConfirmedCount(matchId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, "confirmed"),
        eq(matchPlayers.attended, true)
      )
    );

  return result?.count || 0;
}

/**
 * Get match rating progress for UI display
 * Per PLAN 06-03 Task 4: combines raters and confirmed counts with status check
 */
export async function getMatchRatingProgress(
  matchId: string
): Promise<{
  raters: number;
  confirmed: number;
  percentage: number;
  isRated: boolean;
}> {
  // Get match status
  const [match] = await db
    .select({ status: matches.status })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  const isRated = match?.status === "rated";

  const raters = await getMatchRatersCount(matchId);
  const confirmed = await getMatchConfirmedCount(matchId);
  const percentage = confirmed > 0 ? (raters / confirmed) * 100 : 0;

  return {
    raters,
    confirmed,
    percentage,
    isRated,
  };
}
