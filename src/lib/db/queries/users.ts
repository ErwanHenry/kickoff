import { db } from '@/db';
import { notificationPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user notification preferences
 * Returns default preferences (all enabled) if user has none set
 *
 * Per CONTEXT.md D-10: User-configurable email preferences with defaults
 * Per plan 10-02 Task 2: Query functions for notification preferences
 *
 * @param userId - The user ID to fetch preferences for
 * @returns Notification preferences object (all true if not set)
 */
export async function getUserNotificationPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  // Default: all enabled (D-10)
  if (!prefs) {
    return {
      waitlistPromotion: true,
      deadlineReminder: true,
      postMatchRating: true,
      newRecurringMatch: true,
      welcomeEmail: true,
    };
  }

  return prefs;
}

/**
 * Create default notification preferences for a new user
 * All preferences are set to true (opt-in by default)
 *
 * @param userId - The user ID to create preferences for
 */
export async function createDefaultNotificationPreferences(userId: string) {
  await db.insert(notificationPreferences).values({
    userId,
    waitlistPromotion: true,
    deadlineReminder: true,
    postMatchRating: true,
    newRecurringMatch: true,
    welcomeEmail: true,
  });
}

/**
 * Update user notification preferences
 * Accepts partial updates - only specified fields are changed
 *
 * @param userId - The user ID to update preferences for
 * @param updates - Partial object with preferences to update
 */
export async function updateUserNotificationPreferences(
  userId: string,
  updates: Partial<{
    waitlistPromotion: boolean;
    deadlineReminder: boolean;
    postMatchRating: boolean;
    newRecurringMatch: boolean;
    welcomeEmail: boolean;
  }>
) {
  await db
    .update(notificationPreferences)
    .set(updates)
    .where(eq(notificationPreferences.userId, userId));
}
