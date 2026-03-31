import { resend } from '@/lib/auth';
import { db } from '@/db';
import { matches, matchPlayers, users } from '@/db/schema';
import { eq, and, gt, lte } from 'drizzle-orm';
import { sendDeadlineReminderEmail } from '@/lib/utils/emails';
import { addHours } from 'date-fns';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Validate CRON_SECRET (Phase 09 pattern)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const twoHoursFromNow = addHours(now, 2);
  let emailCount = 0;
  const errors: string[] = [];

  try {
    // Find matches with deadline in 2 hours (±5 min window to account for cron timing)
    const upcomingMatches = await db
      .select({
        id: matches.id,
        title: matches.title,
        date: matches.date,
        shareToken: matches.shareToken,
        deadline: matches.deadline,
      })
      .from(matches)
      .where(
        and(
          gt(matches.deadline, addHours(now, 1, 55)), // > 1h 55m from now
          lte(matches.deadline, addHours(now, 2, 5))  // <= 2h 5m from now
        )
      );

    console.log(`Found ${upcomingMatches.length} matches with deadlines in ~2h`);

    // For each match, send reminders to confirmed players
    for (const match of upcomingMatches) {
      const players = await db
        .select({
          userId: matchPlayers.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(matchPlayers)
        .innerJoin(users, eq(matchPlayers.userId, users.id))
        .where(
          and(
            eq(matchPlayers.matchId, match.id),
            eq(matchPlayers.status, 'confirmed')
          )
        );

      console.log(`Sending reminders to ${players.length} players for match ${match.id}`);

      // Send reminder to each player
      for (const player of players) {
        if (!player.userId) continue;

        try {
          await sendDeadlineReminderEmail(
            player.userId,
            player.userName,
            player.userEmail,
            match.title,
            match.date,
            match.shareToken
          );
          emailCount++;
        } catch (error) {
          const errorMsg = `Failed to send reminder to ${player.userEmail}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }

    return Response.json({
      success: true,
      matchesProcessed: upcomingMatches.length,
      emailsSent: emailCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Deadline reminder cron failed:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
