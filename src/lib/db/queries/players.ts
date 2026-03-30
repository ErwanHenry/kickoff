import { db } from '@/db';
import { matchPlayers, users, playerStats, matches } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface PlayerWithStats {
  id: string;
  name: string;
  avgTechnique: number;
  avgPhysique: number;
  avgCollectif: number;
  totalRatings: number;
}

/**
 * Get all confirmed players for a match with their stats
 * Defaults to 3.0 for players without stats (guests, new players)
 *
 * @param matchId - The match UUID
 * @param groupId - The match's groupId (optional, for group-specific stats)
 * @returns Array of players with their rating averages
 */
export async function getMatchPlayersWithStats(
  matchId: string,
  groupId?: string
): Promise<PlayerWithStats[]> {
  // First, get the match to find its groupId if not provided
  let matchGroupId = groupId;
  if (!matchGroupId) {
    const [match] = await db
      .select({ groupId: matches.groupId })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    matchGroupId = match?.groupId ?? undefined;
  }

  // Build the condition for group-specific stats
  const groupCondition = matchGroupId ? eq(playerStats.groupId, matchGroupId) : undefined;

  // Query players with stats, preferring group-specific stats
  const players = await db
    .select({
      id: matchPlayers.id,
      name: sql<string>`COALESCE(${users.name}, ${matchPlayers.guestName})`,
      avgTechnique: playerStats.avgTechnique,
      avgPhysique: playerStats.avgPhysique,
      avgCollectif: playerStats.avgCollectif,
      totalRatings: playerStats.totalRatingsReceived,
    })
    .from(matchPlayers)
    .leftJoin(users, eq(matchPlayers.userId, users.id))
    .leftJoin(playerStats, and(
      eq(playerStats.userId, matchPlayers.userId),
      groupCondition
    ))
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, 'confirmed')
      )
    );

  // Default to 3.0 for missing stats (Postgres returns null for LEFT JOIN)
  // Also convert Decimal type to number
  return players.map(p => ({
    ...p,
    avgTechnique: Number(p.avgTechnique) || 3.0,
    avgPhysique: Number(p.avgPhysique) || 3.0,
    avgCollectif: Number(p.avgCollectif) || 3.0,
    totalRatings: p.totalRatings || 0,
  }));
}
