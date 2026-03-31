# Phase 9: Recurrence & Automation - Context

**Gathered:** 2026-03-31 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Weekly recurring matches are automatically created via cron, and group members are notified. When an organizer creates a match with recurrence="weekly", the system automatically creates the next week's occurrence via a cron job. The new match inherits the parent's settings (time, location, max/min players, group) but players are NOT auto-confirmed — they must RSVP each week to measure reliability. Group members receive email notifications when new occurrences are created.

**Requirements covered:** RECUR-01, RECUR-02, RECUR-03, RECUR-04, MATCH-03

</domain>

<decisions>
## Implementation Decisions

### Cron Infrastructure
- **D-01:** Use Vercel Cron Jobs configured in `vercel.json` with a `CRON_SECRET` environment variable for endpoint security
- **D-02:** Cron schedule runs daily at midnight to check for recurring matches that need next occurrences created

### Recurrence Logic
- **D-03:** Use `date-fns` (already installed) to calculate next occurrence by adding 7 days to parent match's date
- **D-04:** New occurrences inherit ALL parent settings: location, maxPlayers, minPlayers, groupId, deadline (relative to new date)
- **D-05:** New occurrences have different: shareToken (new nanoid), status (always "open"), parentMatchId (links to parent), date (calculated), no players auto-confirmed

### Match Creation
- **D-06:** Reuse existing `createMatch` Server Action from `src/app/api/matches/actions.ts` for creating new occurrences
- **D-07:** Query matches where `recurrence = "weekly"` AND `parentMatchId IS NULL` (parent matches only) to find recurring series

### Email Notifications
- **D-08:** Use existing Resend instance from `src/lib/auth.ts` for sending emails
- **D-09:** Query group members via `getGroupMembers` from `src/lib/db/queries/groups.ts` to get recipient emails
- **D-10:** Email template includes: match title, date/time, location, link to match page, CTA to RSVP

### Cron Endpoint Security
- **D-11:** Protect cron endpoint with `CRON_SECRET` header validation against environment variable
- **D-12:** Return 401 Unauthorized if secret doesn't match, log failed attempts

### Claude's Discretion
- Cron schedule expression timing (daily at midnight recommended, but flexible based on usage patterns)
- Email template design and wording
- Error handling for cron failures (logging, retry logic)
- Whether to send emails for all groups or only when new match is successfully created

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 9 — Phase 9 goal, success criteria, and requirements (RECUR-01 through RECUR-04, MATCH-03)
- `.planning/REQUIREMENTS.md` — Full requirements specification for recurrence and automation
- `CLAUDE.md` — Project instructions, conventions, mobile-first principles

### Database Schema
- `src/db/schema.ts` — Complete database schema with recurrence enum, parentMatchId self-reference, matches and group_members tables

### Existing Code Patterns
- `src/app/api/matches/actions.ts` — createMatch Server Action to reuse for new occurrences
- `src/lib/auth.ts` — Resend configuration for email sending
- `src/lib/db/queries/groups.ts` — getGroupMembers query for email recipients
- `package.json` — date-fns dependency (line 29) for date calculations

### Prior Context
- `.planning/phases/02-match-creation-guest-rsvp/02-CONTEXT.md` — Match creation patterns, recurrence field in form
- `.planning/phases/08-groups-leaderboards/08-CONTEXT.md` — Groups structure, member roles, match-group association

### Configuration
- `vercel.json` — Existing Vercel configuration where cron jobs will be added
- `.env.example` — RESEND_API_KEY environment variable reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **createMatch Server Action** — `src/app/api/matches/actions.ts` has match creation logic with validation
- **Resend email client** — Configured in `src/lib/auth.ts` for magic link emails, can be reused
- **getGroupMembers query** — Returns all group members with emails for notifications
- **date-fns** — Date manipulation library already installed for adding 7 days

### Established Patterns
- **Server Actions in lib/actions/** — Next.js 16 requires Actions outside app/api/ directory
- **Database queries in lib/db/queries/** — Separation of queries from actions
- **Zod validation** — All inputs validated via Zod schemas
- **Security headers** — vercel.json already has security headers configured

### Integration Points
- **Cron endpoint** — New API route at `/api/cron/recurring-matches` protected by CRON_SECRET
- **Match creation** — Call createMatch action with inherited parent settings
- **Email sending** — Resend.send() with group member emails from getGroupMembers
- **Environment variables** — Add CRON_SECRET to .env.example and vercel env

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase with clear requirements from ROADMAP and prior phases.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 09-recurrence-automation*
*Context gathered: 2026-03-31*
