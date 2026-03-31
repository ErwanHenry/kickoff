import { db } from '@/db';
import { matchPlayers, users, playerStats, matches, ratings } from '@/db/schema';
import { eq, and, sql, or, desc, limit } from 'drizzle-orm';
import type { Player, BalanceResult } from '@/lib/team-balancer';
import { parseDecimal } from '@/lib/stats';

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

// ============ PLAYER PROFILE QUERIES ============

export interface PlayerProfileData {
  id: string;
  name: string;
  createdAt: Date;
  matchesPlayed: number;
  attendanceRate: number;
  avgTechnique: number;
  avgPhysique: number;
  avgCollectif: number;
  avgOverall: number;
  totalRatingsReceived: number;
  lastMatchDate: Date | null;
}

export interface MatchHistoryEntry {
  matchId: string;
  shareToken: string;
  date: Date;
  location: string;
  title: string | null;
  status: string;
  attended: boolean | null;
  team: 'A' | 'B' | null;
  scoreTeamA: number | null;
  scoreTeamB: number | null;
  avgRating: number | null;
}

export interface CommentEntry {
  id: string;
  comment: string;
  createdAt: Date;
  matchId: string;
  matchTitle: string | null;
  matchDate: Date;
}

/**
 * Get complete player profile data
 * Fetches user info and stats, preferring group-specific stats, fallback to global
 * Defaults all fields to 0 for new players
 */
export async function getPlayerProfile(
  userId: string,
  groupId?: string
): Promise<PlayerProfileData> {
  // Fetch user
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Fetch stats (prefer groupId-specific, fallback to global where groupId=null)
  const groupCondition = groupId
    ? eq(playerStats.groupId, groupId)
    : sql`${playerStats.groupId} IS NULL`;

  const [stats] = await db
    .select()
    .from(playerStats)
    .where(
      and(
        eq(playerStats.userId, userId),
        // Prefer group-specific, but also accept global stats as fallback
        groupId
          ? or(
              groupCondition,
              sql`${playerStats.groupId} IS NULL`
            )
          : groupCondition
      )
    )
    .orderBy(
      // Prefer group-specific stats (groupId != NULL) over global
      sql`CASE WHEN ${playerStats.groupId} IS NOT NULL THEN 0 ELSE 1 END`
    )
    .limit(1);

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
    matchesPlayed: stats?.matchesPlayed || 0,
    attendanceRate: parseDecimal(stats?.attendanceRate),
    avgTechnique: parseDecimal(stats?.avgTechnique),
    avgPhysique: parseDecimal(stats?.avgPhysique),
    avgCollectif: parseDecimal(stats?.avgCollectif),
    avgOverall: parseDecimal(stats?.avgOverall),
    totalRatingsReceived: stats?.totalRatingsReceived || 0,
    lastMatchDate: stats?.lastMatchDate || null,
  };
}

/**
 * Get player match history (last 10 matches)
 * Returns matches where player confirmed or no-show, with ratings received
 */
export async function getPlayerMatchHistory(
  userId: string,
  limitCount: number = 10
): Promise<MatchHistoryEntry[]> {
  const history = await db
    .select({
      matchId: matches.id,
      shareToken: matches.shareToken,
      date: matches.date,
      location: matches.location,
      title: matches.title,
      status: matches.status,
      attended: matchPlayers.attended,
      team: matchPlayers.team,
      scoreTeamA: matches.scoreTeamA,
      scoreTeamB: matches.scoreTeamB,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(
      and(
        eq(matchPlayers.userId, userId),
        or(
          eq(matchPlayers.status, 'confirmed'),
          eq(matchPlayers.status, 'no_show')
        )
      )
    )
    .orderBy(desc(matches.date))
    .limit(limitCount);

  // For each match, calculate avg rating received by this player
  const historyWithRatings = await Promise.all(
    history.map(async (match) => {
      const [ratingResult] = await db
        .select({
          avgRating: sql<number>`AVG((${ratings.technique} * 0.4 + ${ratings.physique} * 0.3 + ${ratings.collectif} * 0.3))`,
        })
        .from(ratings)
        .where(
          and(
            eq(ratings.matchId, match.matchId),
            eq(ratings.ratedId, userId)
          )
        );

      return {
        ...match,
        avgRating: ratingResult?.avgRating ? Math.round(ratingResult.avgRating * 10) / 10 : null,
      };
    })
  );

  return historyWithRatings;
}

/**
 * Get player comments (last 10 anonymous comments)
 * Returns comments received by player with match context
 */
export async function getPlayerComments(
  userId: string,
  limitCount: number = 10
): Promise<CommentEntry[]> {
  return db
    .select({
      id: ratings.id,
      comment: ratings.comment,
      createdAt: ratings.createdAt,
      matchId: ratings.matchId,
      matchTitle: matches.title,
      matchDate: matches.date,
    })
    .from(ratings)
    .innerJoin(matches, eq(ratings.matchId, matches.id))
    .where(
      and(
        eq(ratings.ratedId, userId),
        sql`${ratings.comment} IS NOT NULL`
      )
    )
    .orderBy(desc(ratings.createdAt))
    .limit(limitCount);
}
