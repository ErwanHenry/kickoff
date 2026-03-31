import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getParentMatchesNeedingNextOccurrence } from '@/lib/db/queries/recurrence';
import { createRecurringMatchOccurrence } from '@/lib/actions/recurrence';
import { sendRecurringMatchNotification } from '@/lib/utils/emails';

/**
 * Vercel Cron endpoint for recurring match creation
 * Called daily at midnight UTC per vercel.json configuration
 *
 * Per D-11: Protect with CRON_SECRET header validation
 * Per D-12: Return 401 if secret doesn't match, log failed attempts
 * Per Plan 09-02: Send email notifications after match creation
 */
export async function POST(request: Request) {
  // Get headers
  const headersList = await headers();

  // Read CRON_SECRET from environment
  const cronSecret = process.env.CRON_SECRET;

  // Check if CRON_SECRET is configured (per D-12)
  if (!cronSecret) {
    console.error('[CRON] Server misconfigured: CRON_SECRET env var missing');
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  // Validate Authorization header (per D-11)
  const authHeader = headersList.get('authorization');
  const expectedAuthHeader = `Bearer ${cronSecret}`;

  if (authHeader !== expectedAuthHeader) {
    // Log failed attempt (per D-12)
    console.warn(`[CRON] Unauthorized access attempt: ${authHeader}`);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get parent matches that need next occurrence
    const parentsNeedingNext = await getParentMatchesNeedingNextOccurrence();

    console.log(`[CRON] Found ${parentsNeedingNext.length} recurring matches needing next occurrence`);

    // Create occurrences in parallel, handle failures gracefully
    const results = await Promise.allSettled(
      parentsNeedingNext.map(async (parent) => {
        try {
          const newMatch = await createRecurringMatchOccurrence(parent.id);
          if (!newMatch) {
            throw new Error('Failed to create match: no result returned');
          }
          console.log(`[CRON] Created match ${newMatch.id} for parent ${parent.id}`);

          // Send email notification if group exists (per Plan 09-02)
          if (parent.groupId) {
            try {
              await sendRecurringMatchNotification(newMatch.id, parent.groupId);
            } catch (emailError) {
              // Log email error but don't fail the cron job (per anti-pattern)
              console.error(`[CRON] Failed to send notification for match ${newMatch.id}:`, emailError);
              return {
                success: true,
                matchId: newMatch.id,
                parentMatchId: parent.id,
                emailError: emailError instanceof Error ? emailError.message : String(emailError),
              };
            }
          }

          return {
            success: true,
            matchId: newMatch.id,
            parentMatchId: parent.id,
          };
        } catch (error) {
          console.error(`[CRON] Failed to create match for parent ${parent.id}:`, error);
          return {
            success: false,
            parentMatchId: parent.id,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Count succeeded and failed
    // Matches with emailError are still considered succeeded (match creation is primary concern)
    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.success === true).length;

    // Count email errors separately
    const emailErrors = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success === true && 'emailError' in r.value && !!r.value.emailError
    ).length;

    const failed = results.length - succeeded;

    console.log(`[CRON] Completed: ${succeeded} created, ${emailErrors} email errors, ${failed} failed`);

    return NextResponse.json({
      message: `Cron completed: ${succeeded} created, ${emailErrors} email errors, ${failed} failed`,
      succeeded,
      emailErrors,
      failed,
      total: results.length,
    });
  } catch (error) {
    console.error('[CRON] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
