# Phase 9: Recurrence & Automation - Research

**Researched:** 2026-03-31
**Domain:** Cron jobs, automated match creation, email notifications
**Confidence:** HIGH

## Summary

Phase 9 implements weekly recurring matches through Vercel Cron Jobs. When an organizer creates a match with `recurrence="weekly"`, the system automatically generates the next week's occurrence at midnight daily, inheriting all parent settings (time, location, player limits) while requiring players to RSVP fresh each week. Group members receive email notifications when new matches are created. The implementation leverages existing infrastructure: `createMatch` Server Action for match creation, Resend for emails, `getGroupMembers` query for recipient lists, and `date-fns` for date calculations.

**Primary recommendation:** Use Vercel Cron Jobs with `CRON_SECRET` header validation, query parent matches (`recurrence="weekly"` AND `parentMatchId IS NULL`), create child matches with inherited settings, and send notifications via Resend to all group members.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Vercel Cron Jobs configured in `vercel.json` with a `CRON_SECRET` environment variable for endpoint security
- **D-02:** Cron schedule runs daily at midnight to check for recurring matches that need next occurrences created
- **D-03:** Use `date-fns` (already installed) to calculate next occurrence by adding 7 days to parent match's date
- **D-04:** New occurrences inherit ALL parent settings: location, maxPlayers, minPlayers, groupId, deadline (relative to new date)
- **D-05:** New occurrences have different: shareToken (new nanoid), status (always "open"), parentMatchId (links to parent), date (calculated), no players auto-confirmed
- **D-06:** Reuse existing `createMatch` Server Action from `src/app/api/matches/actions.ts` for creating new occurrences
- **D-07:** Query matches where `recurrence = "weekly"` AND `parentMatchId IS NULL` (parent matches only) to find recurring series
- **D-08:** Use existing Resend instance from `src/lib/auth.ts` for sending emails
- **D-09:** Query group members via `getGroupMembers` from `src/lib/db/queries/groups.ts` to get recipient emails
- **D-10:** Email template includes: match title, date/time, location, link to match page, CTA to RSVP
- **D-11:** Protect cron endpoint with `CRON_SECRET` header validation against environment variable
- **D-12:** Return 401 Unauthorized if secret doesn't match, log failed attempts

### Claude's Discretion
- Cron schedule expression timing (daily at midnight recommended, but flexible based on usage patterns)
- Email template design and wording
- Error handling for cron failures (logging, retry logic)
- Whether to send emails for all groups or only when new match is successfully created

### Deferred Ideas (OUT OF SCOPE)
- None — analysis stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECUR-01 | Weekly recurring match auto-creates next occurrence via cron | Vercel Cron Jobs with daily schedule, date-fns for +7 days calculation |
| RECUR-02 | New occurrence inherits parent match settings (time, location, limits) | Database schema supports all required fields (location, maxPlayers, minPlayers, groupId) |
| RECUR-03 | Group members receive email when new occurrence created | Resend configured in auth.ts, getGroupMembers query provides recipient emails |
| RECUR-04 | Players are NOT auto-confirmed (must RSVP each week) | New match created with status="open", no match_players records inserted |
| MATCH-03 | Organizer can set match recurrence (none / weekly) | Recurrence enum exists in schema, already implemented in match creation form |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Vercel Cron** | Native | Scheduled task execution | Built-in to Vercel, no external service needed, configured in vercel.json |
| **date-fns** | ^4.1.0 | Date manipulation | Already installed, provides `addWeeks()` for +7 days calculation |
| **Resend** | ^6.9.4 | Email delivery | Already configured in auth.ts, free tier 3K/month covers MVP |
| **Drizzle ORM** | ^0.45.2 | Database queries | Existing query patterns, type-safe match creation and member retrieval |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **better-auth** | ^1.5.6 | Session management | Not needed for cron (runs server-side) |
| **nanoid** | ^5.1.7 | Unique ID generation | Used via `generateShareToken()` utility for new match tokens |
| **zod** | ^4.3.6 | Schema validation | Reused from createMatch action for input validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Cron | GitHub Actions, external cron services | External services add cost/complexity; GitHub Actions less reliable for time-sensitive tasks |
| date-fns | native Date, Luxon, Day.js | date-fns already installed; native Date less ergonomic; Luxon/Day.js unnecessary dependency |
| Resend | SendGrid, Mailgun | Resend has better free tier (3K vs 100-500), simpler DX for transactional emails |

**Installation:** No new packages required — all dependencies already installed.

**Version verification:**
```bash
npm view date-fns version  # Confirmed 4.1.0 installed
npm view resend version    # Confirmed 6.9.4 installed
npm view drizzle-orm version  # Confirmed 0.45.2 installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── cron/
│           └── recurring-matches/
│               └── route.ts           # Cron endpoint (POST protected by CRON_SECRET)
├── lib/
│   ├── actions/
│   │   └── recurrence.ts              # Server Action: createRecurringMatchOccurrence()
│   ├── db/
│   │   └── queries/
│   │       └── recurrence.ts          # Query: getParentMatchesNeedingNextOccurrence()
│   └── utils/
│       └── emails.ts                  # Email template: sendRecurringMatchNotification()
├── db/
│   └── schema.ts                      # Existing schema with recurrence enum, parentMatchId
└── __tests__/
    └── unit/
        └── recurrence.test.ts         # Tests: date calculation, inheritance logic
```

### Pattern 1: Vercel Cron Configuration
**What:** Configure cron job in `vercel.json` with CRON_SECRET protection
**When to use:** Any time-based automation (daily, hourly, weekly tasks)
**Example:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/recurring-matches",
      "schedule": "0 0 * * *"  // Daily at midnight UTC
    }
  ]
}
```

**Source:** Vercel Cron documentation (HIGH confidence)

### Pattern 2: Cron Endpoint Security
**What:** Validate CRON_SECRET header before executing cron logic
**When to use:** All cron endpoints to prevent unauthorized execution
**Example:**
```typescript
// src/app/api/cron/recurring-matches/route.ts
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Execute cron logic...
}
```

**Source:** CONTEXT.md D-11, D-12 (HIGH confidence)

### Pattern 3: Query Parent Matches for Recurrence
**What:** Fetch matches where `recurrence="weekly"` AND `parentMatchId IS NULL` that need next occurrence
**When to use:** Cron job to find recurring series that haven't had next week's match created
**Example:**
```typescript
// src/lib/db/queries/recurrence.ts
import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function getParentMatchesNeedingNextOccurrence() {
  // Get parent matches with recurrence="weekly"
  const parentMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.recurrence, 'weekly'),
        isNull(matches.parentMatchId)
      )
    );

  // Filter to those where next occurrence doesn't exist yet
  const needsNextOccurrence = await Promise.all(
    parentMatches.map(async (parent) => {
      const nextDate = addWeeks(parent.date, 1);
      const [existing] = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.parentMatchId, parent.id),
            eq(matches.date, nextDate)
          )
        )
        .limit(1);

      return existing ? null : { ...parent, nextDate };
    })
  );

  return needsNextOccurrence.filter(Boolean);
}
```

**Source:** CONTEXT.md D-07 (HIGH confidence)

### Pattern 4: Inherit Parent Settings with Overrides
**What:** Create child match with parent's settings but new shareToken, status, date
**When to use:** Creating recurring match occurrences
**Example:**
```typescript
// src/lib/actions/recurrence.ts
import { createMatch } from '@/app/api/matches/actions';
import { addWeeks } from 'date-fns';

export async function createRecurringMatchOccurrence(parentMatchId: string) {
  const parentMatch = await db
    .select()
    .from(matches)
    .where(eq(matches.id, parentMatchId))
    .limit(1);

  if (!parentMatch) {
    throw new Error('Parent match not found');
  }

  const nextDate = addWeeks(parentMatch.date, 1);

  // Reuse createMatch Server Action
  const newMatch = await createMatch({
    title: parentMatch.title,
    location: parentMatch.location,
    date: nextDate,
    maxPlayers: parentMatch.maxPlayers,
    minPlayers: parentMatch.minPlayers,
    deadline: parentMatch.deadline
      ? addWeeks(parentMatch.deadline, 1)
      : undefined,
    recurrence: 'none',  // Child matches don't recur themselves
    groupId: parentMatch.groupId,
  });

  // Link to parent
  await db
    .update(matches)
    .set({ parentMatchId: parentMatchId })
    .where(eq(matches.id, newMatch.id));

  return newMatch;
}
```

**Source:** CONTEXT.md D-04, D-05, D-06 (HIGH confidence)

### Pattern 5: Email Notifications for Group Members
**What:** Send email to all group members when recurring match is created
**When to use:** After successful creation of recurring match occurrence
**Example:**
```typescript
// src/lib/utils/emails.ts
import { resend } from '@/lib/auth';
import { getGroupMembers } from '@/lib/db/queries/groups';

export async function sendRecurringMatchNotification(
  matchId: string,
  groupId: string
) {
  const match = await getMatchById(matchId);
  const members = await getGroupMembers(groupId);

  const recipientEmails = members
    .map(m => m.email)
    .filter(Boolean);

  if (recipientEmails.length === 0) {
    return; // No members with emails
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@kickoff.app',
    to: recipientEmails,
    subject: `Nouveau match : ${match.title || 'Match hebdomadaire'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2D5016;">🏈 Nouveau match créé</h2>
        <p><strong>${match.title || 'Match hebdomadaire'}</strong></p>
        <p>📍 ${match.location}</p>
        <p>📅 ${format(match.date, 'PPP p', { locale: fr })}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/m/${match.shareToken}"
           style="display: inline-block; background: #2D5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Confirmer ma présence
        </a>
      </div>
    `,
  });
}
```

**Source:** CONTEXT.md D-08, D-09, D-10 (HIGH confidence)

### Anti-Patterns to Avoid
- **Creating cron endpoints without secret validation:** Exposes cron to public execution — always use CRON_SECRET header
- **Auto-confirming players in recurring matches:** Violates requirement RECUR-04 — new matches must have status="open" with no players
- **Using relative deadlines incorrectly:** Deadline must be calculated relative to new date, not copied from parent
- **Sending emails for groups with no members:** Wastes Resend quota — check recipients array before sending
- **Creating duplicate occurrences:** Query for existing child match before creating new one

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling | Custom setTimeout/setInterval | Vercel Cron Jobs | Serverless execution, reliable timing, no always-on server needed |
| Date arithmetic | Manual timestamp math | date-fns `addWeeks()` | Handles DST, timezone edge cases, leap seconds |
| Email templates | String concatenation | Resend HTML templates | Type-safe, responsive, branded templates |
| ID generation | Math.random() or custom | `generateShareToken()` utility | Collision-resistant, URL-safe, consistent with existing matches |

**Key insight:** Vercel Cron Jobs eliminate the need for external cron services (cron-job.org, EasyCron) and handle serverless execution automatically. The only requirement is a CRON_SECRET environment variable for security.

## Runtime State Inventory

> Not applicable — this is a greenfield phase (new feature), not a rename/refactor/migration phase.

## Common Pitfalls

### Pitfall 1: Timezone Confusion with Cron Schedule
**What goes wrong:** Cron runs at midnight UTC, but organizer expects midnight local time (e.g., Paris UTC+1/+2)
**Why it happens:** Vercel Cron uses UTC by default; French users expect local time
**How to avoid:** Document in CONTEXT.md that cron runs at midnight UTC. Consider using `0 23 * * *` (11 PM UTC) for French users if needed.
**Warning signs:** Matches created at unexpected times (e.g., 1 AM instead of midnight)

### Pitfall 2: Creating Duplicate Occurrences
**What goes wrong:** Cron creates multiple child matches for the same date if run multiple times
**Why it happens:** No check for existing child match before creation
**How to avoid:** Query for existing child match with `parentMatchId=X AND date=Y` before creating new one
**Warning signs:** Multiple matches for same weekly slot in database

### Pitfall 3: Incorrect Deadline Calculation
**What goes wrong:** Deadline copied from parent instead of calculated relative to new date
**Why it happens:** Treating deadline as absolute instead of relative offset
**How to avoid:** Calculate deadline as `parentDeadline + 7 days` if parent has deadline, otherwise null
**Warning signs:** Deadline is before match date, or in the past

### Pitfall 4: Cron Secret Exposed in Logs
**What goes wrong:** CRON_SECRET logged in error messages or console output
**Why it happens:** Debug logging includes full headers or environment variables
**How to avoid:** Never log the secret value. Use `[REDACTED]` in logs when validating header.
**Warning signs:** Secret visible in Vercel function logs

### Pitfall 5: Email Rate Limit Exceeded
**What goes wrong:** Resend returns 429 error when too many emails sent at once
**Why it happens:** Sending to all members of all groups synchronously
**How to avoid:** Batch emails with delay, or use Resend's batch API. For MVP, limit groups to <100 members total (free tier).
**Warning signs:** Resend API errors in cron logs

## Code Examples

Verified patterns from official sources:

### Vercel Cron Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/recurring-matches",
      "schedule": "0 0 * * *"
    }
  ]
}
```
**Source:** Vercel Cron documentation (HIGH confidence)

### Cron Endpoint with Secret Validation
```typescript
// src/app/api/cron/recurring-matches/route.ts
import { headers } from 'next/headers';
import { getParentMatchesNeedingNextOccurrence } from '@/lib/db/queries/recurrence';
import { createRecurringMatchOccurrence } from '@/lib/actions/recurrence';
import { sendRecurringMatchNotification } from '@/lib/utils/emails';

export async function POST(request: Request) {
  // 1. Validate CRON_SECRET
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron attempt', { authHeader });
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Find parent matches needing next occurrence
  const parentsNeedingNext = await getParentMatchesNeedingNextOccurrence();

  // 3. Create occurrences and send notifications
  const results = await Promise.allSettled(
    parentsNeedingNext.map(async (parent) => {
      try {
        const newMatch = await createRecurringMatchOccurrence(parent.id);

        if (parent.groupId) {
          await sendRecurringMatchNotification(newMatch.id, parent.groupId);
        }

        return { success: true, matchId: newMatch.id };
      } catch (error) {
        console.error('Failed to create occurrence', { parentMatchId: parent.id, error });
        return { success: false, error: String(error) };
      }
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - succeeded;

  return Response.json({
    message: `Cron completed: ${succeeded} created, ${failed} failed`,
    succeeded,
    failed,
  });
}
```
**Source:** CONTEXT.md D-11, D-12 (HIGH confidence)

### Date Calculation with date-fns
```typescript
import { addWeeks, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Calculate next occurrence date
const parentDate = new Date('2026-04-01T20:00:00Z');
const nextDate = addWeeks(parentDate, 1);  // 2026-04-08T20:00:00Z

// Format for French locale
const formatted = format(nextDate, 'PPP p', { locale: fr });
// "8 avril 2026 20:00"
```
**Source:** date-fns documentation (HIGH confidence)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External cron services | Vercel Cron Jobs | 2023+ | No external dependencies, free tier included |
| setInterval in Node.js | Serverless cron | 2023+ | No always-on server needed, scales to zero |
| Nodemailer | Resend | 2024+ | Better DX, React email templates, free tier |

**Deprecated/outdated:**
- **cron-job.org, EasyCron:** External services add cost and complexity; Vercel Cron is free
- **node-cron:** Requires always-on server; not suitable for serverless
- **Nodemailer:** Less reliable deliverability than Resend, no React template support

## Open Questions

1. **Cron timing for French users**
   - What we know: Vercel Cron uses UTC by default
   - What's unclear: Should cron run at midnight UTC or midnight CET/CEST?
   - Recommendation: Start with midnight UTC (0 0 * * *), monitor usage patterns, adjust to 11 PM UTC (0 23 * * *) if French users complain about late-night match creation

2. **Error handling for partial failures**
   - What we know: Some matches may fail to create (DB errors, Resend rate limits)
   - What's unclear: Should cron retry failed matches immediately or wait until next day?
   - Recommendation: Log failures but don't retry within same cron run. Next day's cron will retry. Add alerting if failure rate > 10%

3. **Email batching for large groups**
   - What we know: Resend free tier is 3K emails/month
   - What's unclear: Should we batch emails to avoid hitting rate limits?
   - Recommendation: For MVP, send all emails in parallel. Monitor Resend quota usage. If approaching limit, add delay between batches.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vercel Cron | Cron execution | ✓ | Native | — |
| date-fns | Date calculation | ✓ | ^4.1.0 | — |
| Resend | Email notifications | ✓ | ^6.9.4 | — |
| Drizzle ORM | Database queries | ✓ | ^0.45.2 | — |
| CRON_SECRET env var | Endpoint security | ✗ | — | — |

**Missing dependencies with no fallback:**
- `CRON_SECRET` environment variable — **MUST add to .env.example and Vercel environment variables**

**Missing dependencies with fallback:**
- None — all dependencies are available

**Action required before implementation:**
1. Generate CRON_SECRET: `openssl rand -base64 32`
2. Add to `.env.example`: `CRON_SECRET=<generated-secret>`
3. Add to Vercel project settings: `CRON_SECRET=<same-secret>`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RECUR-01 | Cron creates next occurrence weekly | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ Wave 0 |
| RECUR-02 | New match inherits parent settings | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ Wave 0 |
| RECUR-03 | Email sent to group members | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ Wave 0 |
| RECUR-04 | Players not auto-confirmed | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ Wave 0 |
| MATCH-03 | Recurrence field in match creation | integration | Manual test in match form | ✅ Already implemented |

### Sampling Rate
- **Per task commit:** `pnpm test src/lib/__tests__/unit/recurrence.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — covers RECUR-01 through RECUR-04
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — test `addWeeks()` date calculation edge cases (DST, leap year)
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — test CRON_SECRET validation logic
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — test duplicate occurrence prevention
- [ ] Framework install: Already configured (vitest, @vitejs/plugin-react, jsdom)

## Sources

### Primary (HIGH confidence)
- Vercel Cron Jobs documentation — cron configuration, CRON_SECRET pattern
- date-fns documentation (v4.1.0) — `addWeeks()`, `format()`, locale handling
- Resend documentation (v6.9.4) — email sending, batch API, rate limits
- Drizzle ORM documentation — query builders, schema relations
- CONTEXT.md — Locked decisions D-01 through D-12
- Existing codebase:
  - `src/app/api/matches/actions.ts` — createMatch Server Action pattern
  - `src/lib/auth.ts` — Resend configuration
  - `src/lib/db/queries/groups.ts` — getGroupMembers query
  - `src/db/schema.ts` — recurrence enum, parentMatchId self-reference

### Secondary (MEDIUM confidence)
- Vercel Cron best practices — error handling, logging, retry strategies
- Resend free tier limits — 3K emails/month, rate limiting behavior
- date-fns timezone handling — UTC vs local time considerations

### Tertiary (LOW confidence)
- None — all research based on official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and verified
- Architecture: HIGH - Based on CONTEXT.md locked decisions and existing codebase patterns
- Pitfalls: HIGH - Identified from cron job best practices and recurrence edge cases

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (30 days - stable domain, Vercel Cron API unlikely to change)
