import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { addWeeks } from 'date-fns';

export interface ParentMatchWithNextDate {
  id: string;
  title: string | null;
  location: string;
  date: Date;
  maxPlayers: number;
  minPlayers: number;
  deadline: Date | null;
  recurrence: 'none' | 'weekly';
  groupId: string | null;
  createdBy: string;
  shareToken: string;
  nextDate: Date;
}

/**
 * Get parent matches that need their next occurrence created
 * Returns weekly recurring matches (parentMatchId IS NULL) that don't have
 * a child match for the next week yet (prevents duplicates per RECUR-02)
 *
 * Per D-07: Query matches where recurrence="weekly" AND parentMatchId IS NULL
 * Per D-03: Calculate nextDate = addWeeks(parent.date, 1)
 */
export async function getParentMatchesNeedingNextOccurrence(): Promise<ParentMatchWithNextDate[]> {
  // Query all parent matches (weekly recurrence, no parent)
  const parentMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.recurrence, 'weekly'),
        isNull(matches.parentMatchId)
      )
    );

  // For each parent, check if child match exists for next week
  // Use Promise.all for parallel existence checks
  const parentsNeedingChild = await Promise.all(
    parentMatches.map(async (parent) => {
      const nextDate = addWeeks(parent.date, 1);

      // Check if child match exists for this nextDate
      const [existingChild] = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.parentMatchId, parent.id),
            eq(matches.date, nextDate)
          )
        )
        .limit(1);

      // Only return parent if no child exists yet (prevent duplicates)
      if (existingChild) {
        return null;
      }

      // Return only the fields we need (explicit typing)
      return {
        id: parent.id,
        title: parent.title,
        location: parent.location,
        date: parent.date,
        maxPlayers: parent.maxPlayers,
        minPlayers: parent.minPlayers,
        deadline: parent.deadline,
        recurrence: parent.recurrence,
        groupId: parent.groupId,
        createdBy: parent.createdBy,
        shareToken: parent.shareToken,
        nextDate,
      } satisfies ParentMatchWithNextDate;
    })
  );

  // Filter out null results (parents with existing children)
  return parentsNeedingChild.filter((p): p is ParentMatchWithNextDate => p !== null);
}
