import { resend } from '@/lib/auth';
import { db } from '@/db';
import { groupMembers, users, groups, matches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Send email notification for recurring match creation
 *
 * Per CONTEXT.md D-08 through D-10:
 * - D-08: Use existing Resend instance from src/lib/auth.ts
 * - D-09: Query group members for recipient emails
 * - D-10: Email includes match title, date/time, location, link, CTA
 *
 * Per UI-SPEC.md: Branded HTML template with kickoff colors
 *
 * @param matchId - The newly created match ID
 * @param groupId - The group ID to fetch members from
 */
export async function sendRecurringMatchNotification(
  matchId: string,
  groupId: string
): Promise<void> {
  // Fetch match details
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    throw new Error(`Match not found: ${matchId}`);
  }

  // Fetch group details for footer
  const [group] = await db
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    throw new Error(`Group not found: ${groupId}`);
  }

  // Fetch group members with emails (inline query to avoid breaking getGroupMembers API)
  const membersWithEmails = await db
    .select({ email: users.email })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId))
    .then((rows) => rows.map((r) => r.email).filter((email): email is string => email !== null));

  // Per anti-pattern: Skip sending if no recipients (prevents Resend quota waste)
  if (membersWithEmails.length === 0) {
    console.log(`No recipients with emails for group ${groupId}`);
    return;
  }

  // Format date in French locale
  const formattedDate = format(match.date, 'PPP p', { locale: fr }); // e.g., "8 avril 2026 20:00"

  // Prepare email subject
  const subject = match.title ? `Nouveau match : ${match.title}` : 'Match hebdomadaire';

  // Prepare match URL
  const matchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/m/${match.shareToken}`;

  // Prepare HTML template per UI-SPEC.md
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAF5;">
  <div style="max-width: 400px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background-color: #2D5016; padding: 24px; border-radius: 16px 16px 0 0;">
      <h2 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700;">🏈 Nouveau match créé</h2>
    </div>

    <!-- Content -->
    <div style="background-color: #FFFFFF; padding: 24px; border-radius: 0 0 16px 16px;">
      <p style="color: #1E293B; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Un nouveau match a été créé pour ton groupe.
      </p>

      <h3 style="color: #2D5016; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">
        ${match.title || 'Match hebdomadaire'}
      </h3>

      <p style="color: #64748B; font-size: 14px; margin: 0 0 4px 0;">
        📍 ${match.location}
      </p>

      <p style="color: #64748B; font-size: 14px; margin: 0 0 24px 0;">
        📅 ${formattedDate}
      </p>

      <!-- CTA Button -->
      <a href="${matchUrl}"
         style="display: inline-block; background-color: #2D5016; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; text-align: center;">
        Confirmer ma présence
      </a>

      <!-- Secondary Link -->
      <div style="text-align: center; margin-top: 16px;">
        <a href="${matchUrl}" style="color: #2D5016; text-decoration: none; font-size: 14px;">
          Voir le match
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; padding: 16px;">
      <p style="color: #64748B; font-size: 12px; margin: 0;">
        Tu reçois cet email parce que tu es membre du groupe <strong>${group.name}</strong>.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Send email via Resend
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: membersWithEmails,
    subject,
    html,
  });

  console.log(`Sent recurring match notification for ${matchId} to ${membersWithEmails.length} recipients`);
}
