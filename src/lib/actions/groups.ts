'use server';

import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { groups, groupMembers, playerStats } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createGroupSchema } from '@/lib/validations/group';
import { checkSlugExists, getGroupByInviteCode } from '@/lib/db/queries/groups';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Create a new group with auto-generated slug and invite code
 * The creator becomes captain automatically
 * Uses transaction to ensure group + member atomicity
 *
 * @param input - Object containing group name and optional slug
 * @returns Created group data or error message
 */
export async function createGroup(input: { name: string; slug?: string }) {
  // Get session and verify user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Non authentifié' };
  }

  // Parse and validate input
  const { name, slug: providedSlug } = createGroupSchema.parse(input);

  // Auto-generate slug from name if not provided
  let slug = providedSlug;
  if (!slug) {
    slug = generateSlug(name);
  }

  // Ensure slug is unique, append random suffix if needed
  let finalSlug = slug;
  let suffix = 0;
  while (await checkSlugExists(finalSlug)) {
    suffix++;
    finalSlug = `${slug}-${suffix}`;
  }

  // Generate unique invite code (6 chars, URL-safe)
  const inviteCode = nanoid(6);

  // Create group and add creator as captain in a transaction
  try {
    await db.transaction(async (tx) => {
      // Insert group and get the ID
      const groupId = crypto.randomUUID();
      await tx.insert(groups).values({
        id: groupId,
        name,
        slug: finalSlug,
        createdBy: session.user.id,
        inviteCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Add creator as captain
      await tx.insert(groupMembers).values({
        groupId,
        userId: session.user.id,
        role: 'captain',
        joinedAt: new Date(),
      });
    });

    // Revalidate paths
    revalidatePath('/dashboard/groups');
    revalidatePath(`/group/${finalSlug}`);

    return {
      success: true,
      data: {
        slug: finalSlug,
        inviteCode,
      },
    };
  } catch (error) {
    console.error('Group creation error:', error);
    return { error: 'Erreur lors de la création du groupe' };
  }
}

/**
 * Generate URL-friendly slug from group name
 * Converts to lowercase, removes accents, replaces spaces with hyphens
 *
 * @param name - The group name
 * @returns URL-friendly slug
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Join a group via invite code
 * The joining member gets the 'player' role by default
 * Initializes player_stats for the user+group combination
 *
 * @param input - Object containing invite code
 * @returns Success with group data or error message
 */
export async function joinGroup(input: { inviteCode: string }) {
  // Get session and verify user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Non authentifié' };
  }

  // Validate invite code format (6 chars, alphanumeric)
  const codeSchema = z.string().min(6).max(6).regex(/^[A-Z0-9]+$/i);
  const validatedCode = codeSchema.safeParse(input.inviteCode);

  if (!validatedCode.success) {
    return { error: 'Code d\'invitation invalide' };
  }

  const inviteCode = validatedCode.data.toUpperCase();

  try {
    // Verify group exists with this invite code
    const group = await getGroupByInviteCode(inviteCode);

    if (!group) {
      return { error: 'Code d\'invitation invalide' };
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingMember) {
      return { error: 'Tu es déjà membre de ce groupe' };
    }

    // Use transaction to ensure member + stats atomicity
    await db.transaction(async (tx) => {
      // Insert group member with 'player' role
      await tx.insert(groupMembers).values({
        groupId: group.id,
        userId: session.user.id,
        role: 'player',
        joinedAt: new Date(),
      });

      // Initialize player_stats for this user+group combination
      // Use raw SQL with ON CONFLICT DO NOTHING to handle existing stats
      await tx.execute(sql`
        INSERT INTO player_stats (user_id, group_id, matches_played, matches_confirmed, matches_attended, matches_no_show, attendance_rate, avg_technique, avg_physique, avg_collectif, avg_overall, total_ratings_received, last_updated)
        VALUES (${session.user.id}, ${group.id}, 0, 0, 0, 0, 0, 3.00, 3.00, 3.00, 3.00, 0, NOW())
        ON CONFLICT (user_id, group_id) DO NOTHING
      `);
    });

    // Revalidate paths
    revalidatePath('/dashboard/groups');
    revalidatePath(`/group/${group.slug}`);

    return {
      success: true,
      data: {
        slug: group.slug,
        name: group.name,
      },
    };
  } catch (error) {
    console.error('Group join error:', error);
    return { error: 'Erreur lors de la jonction de groupe' };
  }
}
