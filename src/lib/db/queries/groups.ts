import { db } from '@/db';
import { groups, groupMembers, users, playerStats, matches } from '@/db/schema';
import { eq, sql, desc, count, and, inArray } from 'drizzle-orm';
import { parseDecimal } from '@/lib/stats';

export interface GroupWithDetails {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  createdAt: Date;
  createdBy: string;
  creatorName: string | null;
  memberCount: number;
}

export interface UserGroup {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  role: 'captain' | 'manager' | 'player';
  memberCount: number;
  createdAt: Date;
}

/**
 * Get group by slug with creator info and member count
 * Throws error if group not found
 *
 * @param slug - The unique group slug
 * @returns Group with creator name and member count
 */
export async function getGroupBySlug(slug: string): Promise<GroupWithDetails> {
  const [group] = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      inviteCode: groups.inviteCode,
      createdAt: groups.createdAt,
      createdBy: groups.createdBy,
      creatorName: users.name,
      memberCount: count(groupMembers.userId),
    })
    .from(groups)
    .leftJoin(users, eq(groups.createdBy, users.id))
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groups.slug, slug))
    .groupBy(groups.id, users.name)
    .limit(1);

  if (!group) {
    throw new Error(`Group not found: ${slug}`);
  }

  return group;
}

/**
 * Get all groups where user is a member
 * Returns groups ordered by creation date (newest first)
 *
 * @param userId - The user UUID
 * @returns Array of groups with user's role and member count
 */
export async function getUserGroups(userId: string): Promise<UserGroup[]> {
  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      inviteCode: groups.inviteCode,
      role: groupMembers.role,
      memberCount: count(groupMembers.userId).as('memberCount'),
      createdAt: groups.createdAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId))
    .groupBy(groups.id, groupMembers.role)
    .orderBy(desc(groups.createdAt));

  return userGroups;
}

/**
 * Check if a slug is already taken
 *
 * @param slug - The slug to check
 * @returns True if slug exists, false otherwise
 */
export async function checkSlugExists(slug: string): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(groups)
    .where(eq(groups.slug, slug))
    .limit(1);

  return (result?.count ?? 0) > 0;
}

/**
 * Check if an invite code exists
 *
 * @param code - The invite code to check
 * @returns True if code exists, false otherwise
 */
export async function checkInviteCodeExists(code: string): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(groups)
    .where(eq(groups.inviteCode, code))
    .limit(1);

  return (result?.count ?? 0) > 0;
}

// ============ GROUP LEADERBOARD & MATCH HISTORY QUERIES ============

export interface LeaderboardEntry {
  id: string;
  name: string;
  matchesPlayed: number;
  attendanceRate: number;
  avgOverall: number;
  totalRatingsReceived: number;
}

export interface GroupMatchEntry {
  id: string;
  title: string | null;
  date: Date;
  location: string;
  status: string;
  shareToken: string;
  scoreTeamA: number | null;
  scoreTeamB: number | null;
}

export interface GroupMemberEntry {
  id: string;
  name: string;
  role: 'captain' | 'manager' | 'player';
  joinedAt: Date;
}

/**
 * Get group leaderboard ranked by avg_overall
 * Only includes players who have been rated (totalRatingsReceived > 0)
 *
 * @param groupId - The group UUID
 * @returns Array of players ranked by avg_overall DESC
 */
export async function getGroupLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  const leaderboard = await db
    .select({
      id: playerStats.userId,
      name: users.name,
      matchesPlayed: playerStats.matchesPlayed,
      attendanceRate: playerStats.attendanceRate,
      avgOverall: playerStats.avgOverall,
      totalRatingsReceived: playerStats.totalRatingsReceived,
    })
    .from(playerStats)
    .innerJoin(users, eq(playerStats.userId, users.id))
    .where(
      and(
        eq(playerStats.groupId, groupId),
        sql`${playerStats.totalRatingsReceived} > 0` // Only show players with ratings
      )
    )
    .orderBy(desc(playerStats.avgOverall))
    .limit(50);

  // Convert Decimal types to numbers
  return leaderboard.map(entry => ({
    id: entry.id,
    name: entry.name,
    matchesPlayed: entry.matchesPlayed,
    attendanceRate: parseDecimal(entry.attendanceRate),
    avgOverall: parseDecimal(entry.avgOverall),
    totalRatingsReceived: entry.totalRatingsReceived,
  }));
}

/**
 * Get group's match history (played and rated matches only)
 *
 * @param groupId - The group UUID
 * @param limitCount - Maximum number of matches to return (default 20)
 * @returns Array of completed matches ordered by date DESC
 */
export async function getGroupMatchHistory(
  groupId: string,
  limitCount: number = 20
): Promise<GroupMatchEntry[]> {
  const history = await db
    .select({
      id: matches.id,
      title: matches.title,
      date: matches.date,
      location: matches.location,
      status: matches.status,
      shareToken: matches.shareToken,
      scoreTeamA: matches.scoreTeamA,
      scoreTeamB: matches.scoreTeamB,
    })
    .from(matches)
    .where(
      and(
        eq(matches.groupId, groupId),
        inArray(matches.status, ['played', 'rated'])
      )
    )
    .orderBy(desc(matches.date))
    .limit(limitCount);

  return history;
}

/**
 * Get all group members with roles
 *
 * @param groupId - The group UUID
 * @returns Array of members ordered by joined_at ASC
 */
export async function getGroupMembers(groupId: string): Promise<GroupMemberEntry[]> {
  const members = await db
    .select({
      id: groupMembers.userId,
      name: users.name,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(groupMembers.joinedAt);

  return members;
}
