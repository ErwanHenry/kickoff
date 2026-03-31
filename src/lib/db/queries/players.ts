import { db } from '@/db';
import { matchPlayers, users, playerStats, matches } from '@/db/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import type { Player, BalanceResult } from '@/lib/team-balancer';

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

/**
 * Get teams for a match with assigned players and their stats
 * Returns teams A and B with players, scores, and difference
 *
 * @param matchId - The match UUID
 * @returns BalanceResult with teamA, teamB, diff, and algorithm
 */
export async function getMatchTeams(matchId: string): Promise<BalanceResult> {
  // Get the match to find its groupId for group-specific stats
  const [match] = await db
    .select({ groupId: matches.groupId })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  const matchGroupId = match?.groupId ?? undefined;

  // Build the condition for group-specific stats
  const groupCondition = matchGroupId ? eq(playerStats.groupId, matchGroupId) : undefined;

  // Query confirmed players with team assignments
  const players = await db
    .select({
      id: matchPlayers.id,
      name: sql<string>`COALESCE(${users.name}, ${matchPlayers.guestName})`,
      team: matchPlayers.team,
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
        eq(matchPlayers.status, 'confirmed'),
        or(
          eq(matchPlayers.team, 'A'),
          eq(matchPlayers.team, 'B')
        )
      )
    );

  // Convert to Player type and default missing stats
  const allPlayers: Player[] = players.map(p => ({
    id: p.id,
    name: p.name,
    avgTechnique: Number(p.avgTechnique) || 3.0,
    avgPhysique: Number(p.avgPhysique) || 3.0,
    avgCollectif: Number(p.avgCollectif) || 3.0,
    totalRatings: p.totalRatings || 0,
  }));

  // Split into teams A and B
  const teamAPlayers = allPlayers.filter(p => {
    const playerData = players.find(pl => pl.id === p.id);
    return playerData?.team === 'A';
  });

  const teamBPlayers = allPlayers.filter(p => {
    const playerData = players.find(pl => pl.id === p.id);
    return playerData?.team === 'B';
  });

  // Calculate scores
  const calculateScore = (player: Player) => {
    const t = Number(player.avgTechnique) || 3.0;
    const ph = Number(player.avgPhysique) || 3.0;
    const c = Number(player.avgCollectif) || 3.0;
    return t * 0.4 + ph * 0.3 + c * 0.3;
  };

  const scoreA = teamAPlayers.reduce((sum, p) => sum + calculateScore(p), 0);
  const scoreB = teamBPlayers.reduce((sum, p) => sum + calculateScore(p), 0);

  return {
    teamA: {
      players: teamAPlayers,
      totalScore: scoreA,
      playerCount: teamAPlayers.length,
    },
    teamB: {
      players: teamBPlayers,
      totalScore: scoreB,
      playerCount: teamBPlayers.length,
    },
    diff: Math.abs(scoreA - scoreB),
    algorithm: 'brute-force', // Teams were already generated, hardcode algorithm
  };
}
