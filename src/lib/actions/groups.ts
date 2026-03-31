'use server';

import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { groups, groupMembers } from '@/db/schema';
import { auth } from '@/lib/auth';
import { createGroupSchema } from '@/lib/validations/group';
import { checkSlugExists } from '@/lib/db/queries/groups';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

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
      // Insert group
      const [group] = await tx
        .insert(groups)
        .values({
          id: crypto.randomUUID(),
          name,
          slug: finalSlug,
          createdBy: session.user.id,
          inviteCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Add creator as captain
      await tx.insert(groupMembers).values({
        groupId: group.id,
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
