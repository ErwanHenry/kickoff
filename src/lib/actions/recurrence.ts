"use server";

import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateShareToken } from '@/lib/utils/ids';
import { addWeeks } from 'date-fns';

/**
 * Create a recurring match occurrence (child match)
 * Called by cron endpoint, NOT by client code (no session validation)
 *
 * Per D-06: Create inline Server Action with direct db.insert() queries.
 * Do NOT reuse existing createMatch Server Action because it requires
 * session validation (cron has no session) and creates draft status
 * (recurring matches need status="open" immediately).
 *
 * Per D-04: Inherit location, maxPlayers, minPlayers, groupId, deadline (relative)
 * Per D-05: New occurrences have different shareToken, status="open", parentMatchId, date
 * Per RECUR-04: NO match_players records (players not auto-confirmed)
 */
export async function createRecurringMatchOccurrence(parentMatchId: string) {
  // Fetch parent match
  const [parentMatch] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, parentMatchId))
    .limit(1);

  if (!parentMatch) {
    throw new Error(`Parent match not found: ${parentMatchId}`);
  }

  // Calculate next occurrence date (+7 days per D-03)
  const nextDate = addWeeks(parentMatch.date, 1);

  // Calculate next deadline (relative per D-04: +7 days from parent deadline)
  const nextDeadline = parentMatch.deadline ? addWeeks(parentMatch.deadline, 1) : null;

  // Generate new shareToken (not inherited per D-05)
  const newShareToken = generateShareToken();

  // Insert child match with inherited settings and overrides
  const [childMatch] = await db
    .insert(matches)
    .values({
      // Inherited from parent (per D-04)
      title: parentMatch.title,
      location: parentMatch.location,
      maxPlayers: parentMatch.maxPlayers,
      minPlayers: parentMatch.minPlayers,
      groupId: parentMatch.groupId,
      deadline: nextDeadline,
      createdBy: parentMatch.createdBy,

      // Overridden for child match (per D-05)
      date: nextDate,
      shareToken: newShareToken,
      status: 'open', // Always open per D-05
      recurrence: 'none', // Child matches don't recur per D-05
      parentMatchId: parentMatchId, // Links to parent per D-05

      // No match_players records (players not auto-confirmed per RECUR-04)
    })
    .returning();

  return childMatch;
}
