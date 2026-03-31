import { db } from "@/db";
import { matches, matchPlayers, users } from "@/db/schema";
import { eq, and, sql, desc, count } from "drizzle-orm";

/**
 * Get match by share token
 * Returns null if not found (invalid/expired link)
 */
export async function getMatchByShareToken(shareToken: string) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.shareToken, shareToken))
    .limit(1);

  return match || null;
}

/**
 * Get all players for a match with their names and status
 * Returns array of players ordered by confirmation time (newest first)
 */
export async function getMatchPlayers(matchId: string) {
  return db
    .select({
      id: matchPlayers.id,
      name: sql<string>`COALESCE(${matchPlayers.guestName}, ${users.name})`,
      status: matchPlayers.status,
      confirmedAt: matchPlayers.confirmedAt,
      guestToken: matchPlayers.guestToken,
      userId: matchPlayers.userId, // Include userId for profile links
    })
    .from(matchPlayers)
    .leftJoin(users, eq(matchPlayers.userId, users.id))
    .where(eq(matchPlayers.matchId, matchId))
    .orderBy(desc(matchPlayers.confirmedAt));
}

/**
 * Count confirmed players for a match
 * Used for progress display and waitlist calculation
 */
export async function getConfirmedCount(matchId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, "confirmed")
      )
    );

  return result?.count || 0;
}

/**
 * Count waitlisted players for a match
 * Used for display waitlist count (not individual names per D-12)
 */
export async function getWaitlistCount(matchId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, "waitlisted")
      )
    );

  return result?.count || 0;
}

/**
 * Get confirmed players for attendance marking
 * Returns players with their names and team assignments
 * Used by the organizer to mark who actually attended
 */
export async function getConfirmedPlayersForAttendance(matchId: string) {
  return db
    .select({
      id: matchPlayers.id,
      name: sql<string>`COALESCE(${matchPlayers.guestName}, ${users.name})`,
      team: matchPlayers.team,
      confirmedAt: matchPlayers.confirmedAt,
    })
    .from(matchPlayers)
    .leftJoin(users, eq(matchPlayers.userId, users.id))
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, "confirmed")
      )
    )
    .orderBy(matchPlayers.team, matchPlayers.confirmedAt);
}

/**
 * Get match data for OG image generation
 * Returns match with confirmed player count for WhatsApp previews
 * Per plan 10-01 Task 2: SHARE-01, SHARE-02
 */
export async function getMatchForOG(matchId: string) {
  const [match] = await db
    .select({
      id: matches.id,
      title: matches.title,
      location: matches.location,
      date: matches.date,
      maxPlayers: matches.maxPlayers,
      shareToken: matches.shareToken,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) return null;

  // Count confirmed players using sql count for performance
  const [playerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchPlayers)
    .where(
      and(
        eq(matchPlayers.matchId, matchId),
        eq(matchPlayers.status, "confirmed")
      )
    )
    .limit(1);

  return {
    ...match,
    confirmedCount: playerCount?.count ?? 0,
  };
}
