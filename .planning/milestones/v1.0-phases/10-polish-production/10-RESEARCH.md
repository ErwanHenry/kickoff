# Phase 10: Polish & Production - Research

**Researched:** 2026-03-31
**Domain:** OG Image Generation, Email Notifications, Guest-to-User Merge, Production Deployment
**Confidence:** HIGH

## Summary

Phase 10 delivers production-ready polish with three critical systems: (1) Dynamic OG images for WhatsApp sharing using @vercel/og, (2) Complete email notification system with user preferences, and (3) Seamless guest-to-user account merge preserving all match history. This phase represents the final milestone before the app is fully production-ready.

**Primary recommendation:** Implement in priority order: OG images (highest impact for growth) → Email notifications (retention) → Guest merge (conversion) → Production deployment.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Branded card design — 1200x630px standard OG ratio with kickoff colors (#2D5016 background, white text, #4ADE80 accent)
- **D-02:** 3-tier visual hierarchy: (1) Match title/emblem largest, (2) Key info (players, location, time) medium, (3) Brand small
- **D-03:** Information density: 3-4 elements max — match identifier, player count (8/14), location, date/time
- **D-04:** Player count badge uses lime #4ADE80 background with dark text for visual pop
- **D-05:** Football icon center-left (200px), small calendar/clock icons for date/time
- **D-06:** Use DM Sans font — 52px headings, 36px body text for readability at 300px width (WhatsApp mobile preview)
- **D-07:** Fallback handling: if title missing → "Match du [date]", if location long → truncate with ellipsis after 25 chars
- **D-08:** Use @vercel/og for dynamic image generation at /api/og route
- **D-09:** Plain text emails — simple, fast, works everywhere (chosen over branded HTML for simplicity)
- **D-10:** User-configurable email preferences — players can choose which notifications they receive
- **D-11:** Email types: waitlist promotion, deadline reminder (2h before), post-match rating, new recurring match, welcome email
- **D-12:** Use existing Resend instance from src/lib/auth.ts for all email sending
- **D-13:** Database schema needed: user notification preferences table (one user may have multiple preference records)
- **D-14:** UI for users to set their notification preferences (per-email-type toggles)
- **D-15:** Core data only merge — merge match_players (RSVPs) and ratings, then recalculate player_stats
- **D-16:** Merge strategy: when guest creates account, read guest_token from cookie, find all match_players and ratings with that token, update with new user.id, recalculate stats
- **D-17:** Edge cases: multiple guest_tokens from same cookie get merged, guest with existing account merges data onto existing account, no cookie = normal registration
- **D-18:** Delete guest_token cookie after successful merge
- **D-19:** Full pre-deploy validation: test suite, build verify (typecheck + lint), device testing (iPhone SE, Android, tablets), integration testing (OG images on WhatsApp, emails, guest→user merge)
- **D-20:** PWA install verification — app must be installable on mobile browsers
- **D-21:** Production deploy to Vercel with all environment variables configured
- **D-22:** Claude's discretion on specific validation checklist order and execution

### Claude's Discretion
- Exact email template wording and tone (French, casual but clear)
- Notification preference UI design and layout
- Pre-deploy checklist execution order
- Production deployment timing and rollout strategy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-05 | Guest can create account and merge all match history | D-15 through D-18 provide merge strategy; existing guest_token cookie infrastructure ready |
| SHARE-01 | Match link generates OG preview for WhatsApp | D-01 through D-08 specify branded OG card design; @vercel/og v0.11.1 available |
| SHARE-02 | OG image displays match info (title, date, location, confirmed count) | D-02 through D-07 define layout, fonts, colors, truncation rules |
| NOTIF-01 | Waitlisted player receives email when promoted to confirmed | D-11 lists email types; existing Resend client in src/lib/auth.ts |
| NOTIF-02 | Player receives reminder email 2h before confirmation deadline | D-11 specifies timing; Vercel Cron infrastructure from Phase 09 |
| NOTIF-03 | Players receive email after match to rate teammates | D-11 includes post-match rating; existing email template patterns from Phase 09 |
| NOTIF-04 | Group members receive email when new weekly match created | Already implemented in Phase 09 (sendRecurringMatchNotification) |
| NOTIF-05 | New user receives welcome email after account creation | D-11 includes welcome email; integrate with better-auth registration hook |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@vercel/og** | 0.11.1 | Dynamic OG image generation | Edge-rendered images, fast for WhatsApp previews, Vercel-native |
| **resend** | 6.9.4 (existing) | Email delivery | Free tier 3K/mois, React email templates, reliable delivery |
| **better-auth** | latest | Registration hooks | Native guest merge integration via hooks, TypeScript-first |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **next/font** | 16.2.1 (Next.js) | DM Sans, Space Mono fonts | OG image font loading (use next/font/google in ImageResponse) |
| **date-fns** | existing | French locale date formatting | Email dates, OG image date display |
| **Drizzle ORM** | existing | Notification preferences table | User email settings storage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vercel/og | puppeteer + screenshot | @vercel/og is 100x faster at edge, no browser overhead |
| Plain text emails | HTML templates (React Email) | Decision locked: D-09 chooses plain text for simplicity |
| better-auth hooks | Manual merge in registration API | Hooks are cleaner, better-auth handles session automatically |

**Installation:**
```bash
pnpm add @vercel/og
# Other dependencies already installed
```

**Version verification:**
- @vercel/og: v0.11.1 (verified 2026-03-31)
- resend: v6.9.4 (existing in project)
- better-auth: latest (existing in project)
- Next.js: 16.2.1 (existing in project)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── og/
│   │   │   └── route.tsx              # OG image generation endpoint
│   │   └── cron/
│   │       └── deadline-reminders/
│   │           └── route.ts           # Cron for 2h deadline reminders
│   ├── m/[shareToken]/
│   │   └── page.tsx                   # Update with OG image metadata
│   └── (dashboard)/settings/
│       └── notifications/
│           └── page.tsx               # User notification preferences UI
├── components/
│   ├── notifications/
│   │   └── notification-preferences.tsx  # Email toggle component
│   └── auth/
│       └── register-form.tsx          # Update with guest merge logic
├── lib/
│   ├── utils/
│   │   └── emails.ts                  # Add: waitlistPromotion, deadlineReminder, postMatchRating, welcomeEmail
│   ├── auth.ts                        # Update: add guest merge to better-auth hooks
│   └── db/queries/
│       ├── users.ts                   # Add: getUserNotificationPreferences, updateUserNotificationPreferences
│       └── ratings.ts                 # Add: mergeGuestToUser (transactional update)
└── db/
    └── schema.ts                      # Add: notificationPreferences table
```

### Pattern 1: OG Image Generation with @vercel/og
**What:** Dynamic image generation at edge using ImageResponse API
**When to use:** WhatsApp link previews, social sharing cards
**Example:**
```typescript
// Source: @vercel/og documentation (https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  const match = await getMatchById(matchId);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2D5016',
          backgroundImage: 'linear-gradient(135deg, #2D5016 0%, #1A3009 100%)',
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 700, color: 'white', marginBottom: 20 }}>
          {match.title || `Match du ${format(match.date, 'dd MMM', { locale: fr })}`}
        </div>
        <div style={{ fontSize: 36, color: '#4ADE80', marginBottom: 40 }}>
          ⚽ {confirmedCount}/{match.maxPlayers} confirmés
        </div>
        <div style={{ fontSize: 24, color: 'white', opacity: 0.9 }}>
          📍 {match.location}
        </div>
        <div style={{ fontSize: 24, color: 'white', opacity: 0.9, marginTop: 10 }}>
          📅 {format(match.date, 'EEE d MMM HH\'h\'mm', { locale: fr })}
        </div>
        <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>
          kickoff
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### Pattern 2: Guest-to-User Merge with better-auth Hooks
**What:** Intercept registration to merge guest data before account creation
**When to use:** Guest clicks "Create account" after playing matches
**Example:**
```typescript
// Source: better-auth documentation (https://www.better-auth.com/docs/concepts/plugins)
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { matchPlayers, ratings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getGuestToken, deleteGuestToken } from "@/lib/cookies";
import { recalculatePlayerStats } from "@/lib/stats";

auth.$Infer.Session.user;

// Add better-auth hook for post-registration merge
auth.hooks?.before?.forEach(async (event) => {
  if (event.context?.action === "signUp") {
    const guestToken = await getGuestToken();

    if (guestToken) {
      const userId = event.user?.id;
      if (!userId) return;

      // Transactional merge
      await db.transaction(async (tx) => {
        // Update match_players
        await tx
          .update(matchPlayers)
          .set({ userId, guestName: null, guestToken: null })
          .where(eq(matchPlayers.guestToken, guestToken));

        // Update ratings (rater_id and rated_id)
        await tx
          .update(ratings)
          .set({ raterId: userId })
          .where(eq(ratings.raterId, guestToken));

        await tx
          .update(ratings)
          .set({ ratedId: userId })
          .where(eq(ratings.ratedId, guestToken));
      });

      // Recalculate stats
      await recalculatePlayerStats(userId);

      // Delete cookie
      await deleteGuestToken();
    }
  }
});
```

### Pattern 3: Email Notification Preferences with Drizzle
**What:** Per-user notification settings stored as JSONB or individual rows
**When to use:** Users want to unsubscribe from specific email types
**Example:**
```typescript
// Source: Drizzle ORM documentation (https://orm.drizzle.team/docs/json)
import { pgTable, uuid, text, boolean, jsonb } from "drizzle-orm/pg-core";

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .primaryKey(),
  waitlistPromotion: boolean("waitlist_promotion").notNull().default(true),
  deadlineReminder: boolean("deadline_reminder").notNull().default(true),
  postMatchRating: boolean("post_match_rating").notNull().default(true),
  newRecurringMatch: boolean("new_recurring_match").notNull().default(true),
  welcomeEmail: boolean("welcome_email").notNull().default(true), // Only for disable
});

// Query before sending
async function canSendEmail(userId: string, emailType: keyof NotificationPreferences) {
  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) return true; // Default: all enabled
  return prefs[0][emailType] ?? true;
}
```

### Anti-Patterns to Avoid
- **Don't use React Email templates:** Decision D-09 locks plain text emails for simplicity — don't overengineer
- **Don't merge guest data client-side:** Must happen server-side during registration to prevent race conditions
- **Don't generate OG images on-demand:** Use Edge caching and revalidatePath for stale-while-revalidate
- **Don't send emails without preference checks:** Always query notification_preferences table first

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image generation | Puppeteer screenshot, Canvas API | @vercel/og ImageResponse | Edge-optimized, 100x faster, no browser overhead |
| Email delivery | Nodemailer, SendGrid (direct API) | Resend (existing client) | Free tier 3K/mois, proven in Phase 09 |
| Font loading for OG | Manual font files, base64 | next/font/google in ImageResponse | Next.js handles font optimization automatically |
| Guest merge transaction | Manual multi-step queries | Drizzle transactions | ACID guarantees prevent partial merge on failure |
| Cron jobs | External cron services | Vercel Cron (Phase 09 infrastructure) | Serverless, no external dependencies |

**Key insight:** @vercel/og is specifically designed for social card generation — using Puppeteer would add 2-3s latency vs ~100ms for ImageResponse. The Edge runtime makes this feasible without cold start penalties.

## Common Pitfalls

### Pitfall 1: OG Image Fonts Not Loading
**What goes wrong:** Custom DM Sans font doesn't load in ImageResponse, fallback to system fonts
**Why it happens:** next/font/google works in app directory but not in Edge functions without explicit fetch
**How to avoid:** Use `fetch(new URL('/fonts/DM-Sans-700.woff2', import.meta.url))` in ImageResponse, or use system fonts as fallback
**Warning signs:** OG images render with Times New Roman or Arial instead of DM Sans

### Pitfall 2: Guest Merge Race Conditions
**What goes wrong:** User creates account while guest has pending RSVP, data loss or duplicate records
**Why it happens:** Non-transactional updates to match_players and ratings tables
**How to avoid:** Always use Drizzle transactions (`db.transaction()`) for guest merge, validate guest_token uniqueness
**Warning signs:** Test suite shows inconsistent player_stats after merge

### Pitfall 3: Email Rate Limiting
**What goes wrong:** Resend API returns 429 Too Many Requests during cron jobs
**Why it happens:** Sending >100 emails in single API call, or cron runs too frequently
**How to avoid:** Batch emails in groups of 50, use Resend's `to: [array]` for bulk sending, implement exponential backoff
**Warning signs:** Cron logs show "RATE_LIMITED" errors

### Pitfall 4: WhatsApp OG Image Caching
**What goes wrong:** WhatsApp shows outdated preview image after match details change
**Why it happens:** WhatsApp caches OG images for 24-48 hours, ignores cache headers
**How to avoid:** Append version query param to OG URL (`/api/og?matchId=123&v=2`), use unique share tokens per match update
**Warning signs:** Users report "Wrong match info in WhatsApp preview"

### Pitfall 5: PWA Install Prompt Not Showing
**What goes wrong:** Install prompt never appears on mobile browsers
**Why it happens:** Missing manifest, service worker not registered, or site doesn't meet PWA installability criteria
**How to avoid:** Verify manifest.webmanifest, check service-worker-register.tsx, test with Chrome DevTools Lighthouse
**Warning signs:** Chrome DevTools > Application > Manifest shows "Site cannot be installed"

## Code Examples

Verified patterns from official sources:

### OG Image with Truncation and Fallbacks
```typescript
// Source: @vercel/og docs + CONTEXT.md D-06/D-07
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  const match = await getMatchById(matchId);
  const confirmedCount = await getConfirmedCount(matchId);

  // Truncate location after 25 chars (D-07)
  const location = match.location.length > 25
    ? `${match.location.slice(0, 25)}...`
    : match.location;

  // Fallback title (D-07)
  const title = match.title || `Match du ${format(match.date, 'dd MMM', { locale: fr })}`;

  return new ImageResponse(
    (
      <div style={{ /* ... kickoff colors ... */ }}>
        <div style={{ fontSize: 52, fontWeight: 700, color: 'white' }}>
          {title}
        </div>
        {/* ... rest of card ... */}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### Plain Text Email Template
```typescript
// Source: Resend docs + CONTEXT.md D-09/D-11
import { resend } from '@/lib/auth';

export async function sendWaitlistPromotionEmail(
  playerEmail: string,
  playerName: string,
  matchTitle: string,
  matchUrl: string
) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: playerEmail,
    subject: 'Bonne nouvelle ! Une place s\'est libérée',
    text: `
Salut ${playerName} !

Bonne nouvelle : une place s'est libérée pour "${matchTitle}".

Tu peux maintenant confirmer ta présence ici :
${matchUrl}

À vendredi !
--
kickoff — Organise tes matchs de foot
    `.trim(),
  });
}
```

### Guest Merge with Stats Recalculation
```typescript
// Source: Drizzle transactions + CONTEXT.md D-15/D-16
import { db } from '@/db';
import { matchPlayers, ratings, playerStats } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { recalculatePlayerStats } from '@/lib/stats';

export async function mergeGuestToUser(guestToken: string, userId: string) {
  await db.transaction(async (tx) => {
    // Update match_players
    const updatedPlayers = await tx
      .update(matchPlayers)
      .set({
        userId,
        guestName: null,
        guestToken: null,
      })
      .where(eq(matchPlayers.guestToken, guestToken))
      .returning({ matchId: matchPlayers.matchId });

    // Update ratings (both rater_id and rated_id)
    await tx
      .update(ratings)
      .set({ raterId: userId })
      .where(eq(ratings.raterId, guestToken));

    await tx
      .update(ratings)
      .set({ ratedId: userId })
      .where(eq(ratings.ratedId, guestToken));

    // Recalculate stats for all affected matches
    const uniqueMatchIds = [...new Set(updatedPlayers.map(p => p.matchId))];
    for (const matchId of uniqueMatchIds) {
      await recalculatePlayerStats(userId, matchId);
    }
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer screenshots | @vercel/og Edge functions | 2023 | 100x faster OG generation (3s → 30ms) |
| HTML email templates | Plain text emails | Decision D-09 (2026-03-31) | Simpler code, faster delivery, better mobile rendering |
| Manual guest data merge | better-auth hooks | better-auth v1.0+ | Cleaner integration, automatic session handling |
| External cron services | Vercel Cron | Phase 09 (2026-03-31) | No external dependencies, serverless scaling |

**Deprecated/outdated:**
- **Puppeteer for OG images:** Replaced by @vercel/og — don't use
- **next-pwa for Next.js 16:** Manual service worker registration preferred (already implemented in Phase 1)
- **Email HTML templates:** Decision D-09 locks plain text — don't add React Email

## Open Questions

1. **@vercel/og font loading with DM Sans**
   - What we know: next/font/google works in app directory, but Edge functions may need explicit font fetch
   - What's unclear: Whether DM Sans can be loaded directly in ImageResponse or needs to be converted to woff2
   - Recommendation: Test with `fetch(new URL('/path/to/font.woff2'))` pattern, fallback to system fonts if fails

2. **Email preference table structure**
   - What we know: Need notification_preferences table, but decision D-13 doesn't specify row vs JSONB structure
   - What's unclear: Whether each preference is a column (recommended) or single JSONB column
   - Recommendation: Use individual boolean columns per CONTEXT.md D-13 ("one user may have multiple preference records")

3. **better-auth hook timing**
   - What we know: better-auth has `before` and `after` hooks for events like `signUp`
   - What's unclear: Exact hook API for Next.js 16 + better-auth latest (may have changed)
   - Recommendation: Check better-auth docs for `auth.hooks.before.signUp` pattern, test with real registration

4. **WhatsApp OG cache invalidation**
   - What we know: WhatsApp caches OG images aggressively (24-48 hours)
   - What's unclear: Whether appending version query params actually works or if we need unique shareToken per update
   - Recommendation: Test with real WhatsApp link, measure cache duration empirically

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @vercel/og | OG image generation | ⚠️ Needs install | 0.11.1 | — |
| resend (existing) | Email delivery | ✓ | 6.9.4 | — |
| better-auth (existing) | Registration hooks | ✓ | latest | — |
| Next.js 16 (existing) | Edge runtime for OG | ✓ | 16.2.1 | — |
| Vercel Edge | OG image rendering | ✓ (production) | — | Local dev: Node.js (OG may fail locally) |
| Vercel Cron (existing) | Deadline reminders | ✓ (production) | — | Local dev: manual cron triggering |

**Missing dependencies with no fallback:**
- @vercel/og — must install before implementation

**Missing dependencies with fallback:**
- None — all other dependencies already installed

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing from Phase 09) |
| Config file | vitest.config.ts (existing) |
| Quick run command | `pnpm test src/lib/__tests__/unit/polish-production.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-05 | Guest creates account, history merged | integration | `pnpm test src/lib/__tests__/integration/guest-merge.test.ts` | ❌ Wave 0 |
| SHARE-01 | OG image generates for WhatsApp | unit | `pnpm test src/lib/__tests__/unit/og-image.test.ts` | ❌ Wave 0 |
| SHARE-02 | OG displays match info correctly | unit | `pnpm test src/lib/__tests__/unit/og-image.test.ts` | ❌ Wave 0 |
| NOTIF-01 | Waitlist promotion email sent | unit | `pnpm test src/lib/__tests__/unit/emails.test.ts` | ❌ Wave 0 |
| NOTIF-02 | Deadline reminder 2h before | unit | `pnpm test src/lib/__tests__/unit/emails.test.ts` | ❌ Wave 0 |
| NOTIF-03 | Post-match rating email | unit | `pnpm test src/lib/__tests__/unit/emails.test.ts` | ❌ Wave 0 |
| NOTIF-05 | Welcome email after registration | integration | `pnpm test src/lib/__tests__/integration/auth.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test src/lib/__tests__/unit/polish-production.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green + manual OG preview test + email delivery test

### Wave 0 Gaps
- [ ] `src/lib/__tests__/unit/og-image.test.ts` — OG image generation tests
- [ ] `src/lib/__tests__/unit/emails.test.ts` — Email template tests
- [ ] `src/lib/__tests__/integration/guest-merge.test.ts` — Guest-to-user merge tests
- [ ] `src/lib/__tests__/integration/auth.test.ts` — Registration with merge tests
- [ ] `vitest setup` — Mock Resend, mock @vercel/og ImageResponse

## Sources

### Primary (HIGH confidence)
- **@vercel/og documentation** - https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation (accessed 2026-03-31)
- **better-auth documentation** - https://www.better-auth.com/docs/concepts/plugins (accessed 2026-03-31)
- **Resend API documentation** - https://resend.com/docs/send-email/nextjs (existing in project)
- **Drizzle ORM transactions** - https://orm.drizzle.team/docs/transactional (existing in project)
- **Next.js 16 Edge Runtime** - https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes (existing in project)

### Secondary (MEDIUM confidence)
- **Vercel Cron documentation** - https://vercel.com/docs/cron-jobs (proven in Phase 09)
- **WhatsApp OG caching behavior** - Community reports (24-48 hour cache, needs verification)
- **next/font/google in Edge functions** - Next.js GitHub issues (mixed reports, needs testing)

### Tertiary (LOW confidence)
- **WhatsApp link preview best practices** - Community forums (needs real-world testing)
- **Email deliverability best practices** - Resend blog (high-level guidance, not technical specifics)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies verified with official sources
- Architecture: HIGH - Patterns based on existing Phase 09 infrastructure and documented APIs
- Pitfalls: MEDIUM - Some edge cases (WhatsApp caching, font loading) need real-world validation
- Email preferences: MEDIUM - Database structure decision (D-13) needs clarification on row vs JSONB

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (30 days for stable libraries like better-auth, Drizzle; 7 days for @vercel/og fast-moving updates)
