'use server';

import { z } from 'zod';
import { db } from '@/db';
import { matches, matchPlayers } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { balanceTeams, type Player } from '@/lib/team-balancer';
import { getMatchPlayersWithStats } from '@/lib/db/queries/players';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

const generateTeamsSchema = z.object({
  matchId: z.string().uuid(),
});

/**
 * Generate balanced teams for a match and lock the match
 * Only the match creator can generate teams
 *
 * @param input - Object containing matchId
 * @returns Generated teams with scores and diff
 */
export async function generateTeams(input: { matchId: string }) {
  const { matchId } = generateTeamsSchema.parse(input);

  // Get session and verify user is authenticated
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  if (!session?.user) {
    return { error: 'Non authentifié' };
  }

  // Fetch match and verify permissions
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return { error: 'Match non trouvé' };
  }

  if (match.createdBy !== session.user.id) {
    return { error: 'Vous n\'êtes pas l\'organisateur de ce match' };
  }

  if (match.status !== 'open') {
    return { error: 'Le match n\'est pas ouvert pour la génération d\'équipes' };
  }

  // Get confirmed players with their stats
  const players = await getMatchPlayersWithStats(matchId, match.groupId ?? undefined);

  if (players.length < 4) {
    return { error: 'Il faut au moins 4 joueurs confirmés pour générer des équipes' };
  }

  // Generate balanced teams using the algorithm
  const result = balanceTeams(players as Player[]);

  // Assign teams in a transaction (prevents race conditions)
  try {
    await db.transaction(async (tx) => {
      const teamAIds = result.teamA.players.map(p => p.id);
      const teamBIds = result.teamB.players.map(p => p.id);

      // Assign team A
      await tx
        .update(matchPlayers)
        .set({ team: 'A' })
        .where(inArray(matchPlayers.id, teamAIds));

      // Assign team B
      await tx
        .update(matchPlayers)
        .set({ team: 'B' })
        .where(inArray(matchPlayers.id, teamBIds));

      // Lock the match
      await tx
        .update(matches)
        .set({ status: 'locked' })
        .where(eq(matches.id, matchId));
    });

    // Revalidate paths
    revalidatePath(`/match/${matchId}`);
    revalidatePath(`/match/${matchId}/teams`);

    return {
      success: true,
      data: {
        teamA: result.teamA,
        teamB: result.teamB,
        diff: result.diff,
        algorithm: result.algorithm,
      },
    };
  } catch (error) {
    console.error('Team generation error:', error);
    return { error: 'Erreur lors de la génération des équipes' };
  }
}

const reassignPlayerSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  fromTeam: z.enum(['A', 'B']),
  toTeam: z.enum(['A', 'B']),
});

/**
 * Manually reassign a player from one team to another
 * Only the match creator can reassign players
 *
 * @param input - Object containing matchId, playerId, fromTeam, toTeam
 * @returns Success or error message
 */
export async function reassignPlayer(input: {
  matchId: string;
  playerId: string;
  fromTeam: 'A' | 'B';
  toTeam: 'A' | 'B';
}) {
  const { matchId, playerId, fromTeam, toTeam } = reassignPlayerSchema.parse(input);

  // Get session and verify user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Non authentifié' };
  }

  // Fetch match and verify permissions
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return { error: 'Match non trouvé' };
  }

  if (match.createdBy !== session.user.id) {
    return { error: 'Vous n\'êtes pas l\'organisateur de ce match' };
  }

  if (match.status !== 'locked') {
    return { error: 'Les équipes ne sont pas encore générées' };
  }

  try {
    // Update player's team assignment
    await db
      .update(matchPlayers)
      .set({ team: toTeam })
      .where(
        and(
          eq(matchPlayers.id, playerId),
          eq(matchPlayers.matchId, matchId),
          eq(matchPlayers.team, fromTeam)
        )
      );

    revalidatePath(`/match/${matchId}`);
    revalidatePath(`/match/${matchId}/teams`);

    return { success: true };
  } catch (error) {
    console.error('Player reassignment error:', error);
    return { error: 'Erreur lors de la réassignation' };
  }
}
