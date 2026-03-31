import { resend } from '@/lib/auth';
import { db } from '@/db';
import { groupMembers, users, groups, matches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getUserNotificationPreferences } from '@/lib/db/queries/users';

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

/**
 * Send waitlist promotion email when player is promoted from waitlist to confirmed
 * Per CONTEXT.md D-11: Plain text, casual French tone, includes match link
 * Per plan 10-02 Task 3: Waitlist promotion email template
 *
 * @param userId - The user ID to send email to
 * @param userName - The user's first name
 * @param userEmail - The user's email address (nullable)
 * @param matchTitle - The match title (nullable, falls back to date)
 * @param matchDate - The match date
 * @param matchLocation - The match location
 * @param shareToken - The match share token for link
 */
export async function sendWaitlistPromotionEmail(
  userId: string,
  userName: string,
  userEmail: string | null,
  matchTitle: string | null,
  matchDate: Date,
  matchLocation: string,
  shareToken: string
): Promise<void> {
  // Handle missing email (anti-pattern: no errors for null email)
  if (!userEmail) {
    console.log(`Skipping waitlist promotion: user ${userId} has no email`);
    return;
  }

  // Check user preferences (D-10, D-14)
  const prefs = await getUserNotificationPreferences(userId);
  if (!prefs.waitlistPromotion) {
    console.log(`Skipping waitlist promotion: user ${userId} opted out`);
    return;
  }

  // Format match title (fallback to date)
  const title = matchTitle || `Match du ${format(matchDate, 'dd MMM', { locale: fr })}`;

  // Build match URL
  const matchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/m/${shareToken}`;

  // Plain text email body (D-09)
  const text = `
Salut ${userName} !

Bonne nouvelle : une place s'est libérée pour "${title}".

Tu peux maintenant confirmer ta présence ici :
${matchUrl}

À vendredi !
--
kickoff — Organise tes matchs de foot
  `.trim();

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: userEmail,
    subject: 'Bonne nouvelle !',
    text,
  });

  console.log(`Sent waitlist promotion email to ${userEmail}`);
}

/**
 * Send deadline reminder email 2h before match confirmation deadline
 * Per CONTEXT.md D-11: Plain text, urgency, includes confirm link
 * Per plan 10-02 Task 4: Deadline reminder email template
 *
 * @param userId - The user ID to send email to
 * @param userName - The user's first name
 * @param userEmail - The user's email address (nullable)
 * @param matchTitle - The match title (nullable, falls back to date)
 * @param matchDate - The match date
 * @param shareToken - The match share token for link
 */
export async function sendDeadlineReminderEmail(
  userId: string,
  userName: string,
  userEmail: string | null,
  matchTitle: string | null,
  matchDate: Date,
  shareToken: string
): Promise<void> {
  if (!userEmail) {
    console.log(`Skipping deadline reminder: user ${userId} has no email`);
    return;
  }

  const prefs = await getUserNotificationPreferences(userId);
  if (!prefs.deadlineReminder) {
    console.log(`Skipping deadline reminder: user ${userId} opted out`);
    return;
  }

  const title = matchTitle || `Match du ${format(matchDate, 'dd MMM', { locale: fr })}`;
  const matchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/m/${shareToken}`;

  const text = `
Salut ${userName} !

Plus que 2h pour confirmer ta présence à "${title}".

 ${matchUrl}

À tout de suite !
--
kickoff — Organise tes matchs de foot
  `.trim();

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: userEmail,
    subject: 'Plus que 2h pour confirmer',
    text,
  });

  console.log(`Sent deadline reminder email to ${userEmail}`);
}

/**
 * Send post-match rating email when match status changes to 'played'
 * Per CONTEXT.md D-11: Plain text, call to action for rating
 * Per plan 10-02 Task 5: Post-match rating email template
 *
 * @param userId - The user ID to send email to
 * @param userName - The user's first name
 * @param userEmail - The user's email address (nullable)
 * @param matchTitle - The match title (nullable)
 * @param matchLocation - The match location
 * @param shareToken - The match share token for rating link
 */
export async function sendPostMatchRatingEmail(
  userId: string,
  userName: string,
  userEmail: string | null,
  matchTitle: string | null,
  matchLocation: string,
  shareToken: string
): Promise<void> {
  if (!userEmail) {
    console.log(`Skipping post-match rating: user ${userId} has no email`);
    return;
  }

  const prefs = await getUserNotificationPreferences(userId);
  if (!prefs.postMatchRating) {
    console.log(`Skipping post-match rating: user ${userId} opted out`);
    return;
  }

  const title = matchTitle || matchLocation;
  const ratingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/m/${shareToken}/rate`;

  const text = `
Salut ${userName} !

Comment s'est passé "${title}" ?

Note tes coéquipiers :
${ratingUrl}

Bonne semaine !
--
kickoff — Organise tes matchs de foot
  `.trim();

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: userEmail,
    subject: 'Comment s\'est passé le match ?',
    text,
  });

  console.log(`Sent post-match rating email to ${userEmail}`);
}

/**
 * Send welcome email after user registration
 * Per CONTEXT.md D-11: Plain text, warm welcome, explains app value
 * Per plan 10-02 Task 6: Welcome email template
 *
 * Note: Always sent (no preference check) — it's onboarding, not notification
 *
 * @param userName - The user's first name
 * @param userEmail - The user's email address
 */
export async function sendWelcomeEmail(
  userName: string,
  userEmail: string
): Promise<void> {
  if (!userEmail) {
    console.log('Skipping welcome email: user has no email');
    return;
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;

  const text = `
Bienvenue sur kickoff, ${userName} !

Tu peux maintenant créer tes propres matchs et organiser des parties entre potes.

Commence ici :
${dashboardUrl}

À vendredi !
--
kickoff — Organise tes matchs de foot
  `.trim();

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: userEmail,
    subject: 'Bienvenue sur kickoff !',
    text,
  });

  console.log(`Sent welcome email to ${userEmail}`);
}
