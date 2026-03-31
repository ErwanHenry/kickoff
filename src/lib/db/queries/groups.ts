import { db } from '@/db';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, sql, desc, count } from 'drizzle-orm';

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
