# Phase 10: Polish & Production - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Production readiness with optimized sharing (OG images for WhatsApp), complete email notification system, and seamless guest-to-user account merge. This is the final phase before the app is fully production-ready.

**Requirements covered:** AUTH-05, SHARE-01, SHARE-02, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05

</domain>

<decisions>
## Implementation Decisions

### OG Images & Sharing
- **D-01:** Branded card design — 1200x630px standard OG ratio with kickoff colors (#2D5016 background, white text, #4ADE80 accent)
- **D-02:** 3-tier visual hierarchy: (1) Match title/emblem largest, (2) Key info (players, location, time) medium, (3) Brand small
- **D-03:** Information density: 3-4 elements max — match identifier, player count (8/14), location, date/time
- **D-04:** Player count badge uses lime #4ADE80 background with dark text for visual pop — draws eye to availability
- **D-05:** Football icon center-left (200px), small calendar/clock icons for date/time
- **D-06:** Use DM Sans font — 52px headings, 36px body text for readability at 300px width (WhatsApp mobile preview)
- **D-07:** Fallback handling: if title missing → "Match du [date]", if location long → truncate with ellipsis after 25 chars
- **D-08:** Use @vercel/og for dynamic image generation at /api/og route

### Email Notifications
- **D-09:** Plain text emails — simple, fast, works everywhere (chosen over branded HTML for simplicity)
- **D-10:** User-configurable email preferences — players can choose which notifications they receive
- **D-11:** Email types: waitlist promotion, deadline reminder (2h before), post-match rating, new recurring match, welcome email
- **D-12:** Use existing Resend instance from src/lib/auth.ts for all email sending
- **D-13:** Database schema needed: user notification preferences table (one user may have multiple preference records)
- **D-14:** UI for users to set their notification preferences (per-email-type toggles)

### Guest → User Merge
- **D-15:** Core data only merge — merge match_players (RSVPs) and ratings, then recalculate player_stats
- **D-16:** Merge strategy: when guest creates account, read guest_token from cookie, find all match_players and ratings with that token, update with new user.id, recalculate stats
- **D-17:** Edge cases: multiple guest_tokens from same cookie get merged, guest with existing account merges data onto existing account, no cookie = normal registration
- **D-18:** Delete guest_token cookie after successful merge

### Deploy & Validation
- **D-19:** Full pre-deploy validation: test suite, build verify (typecheck + lint), device testing (iPhone SE, Android, tablets), integration testing (OG images on WhatsApp, emails, guest→user merge)
- **D-20:** PWA install verification — app must be installable on mobile browsers
- **D-21:** Production deploy to Vercel with all environment variables configured
- **D-22:** Claude's discretion on specific validation checklist order and execution

### Claude's Discretion
- Exact email template wording and tone (French, casual but clear)
- Notification preference UI design and layout
- Pre-deploy checklist execution order
- Production deployment timing and rollout strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 10 — Phase 10 goal, success criteria, and requirements (AUTH-05, SHARE-01, SHARE-02, NOTIF-01 through NOTIF-05)
- `.planning/REQUIREMENTS.md` — Full requirements specification for polish and production features
- `CLAUDE.md` — Project instructions, conventions, mobile-first principles

### Database Schema
- `src/db/schema.ts` — Complete database schema with users, match_players, ratings, player_stats tables

### Existing Code Patterns
- `src/lib/auth.ts` — Resend configuration for email sending, already used for magic links and recurring match notifications
- `src/lib/utils/emails.ts` — Existing email template functions (sendRecurringMatchNotification as reference)
- `src/lib/cookies.ts` — Guest token cookie handling (read and delete)

### Prior Context
- `.planning/phases/02-match-creation-guest-rsvp/02-CONTEXT.md` — Guest RSVP flow, guest_token handling
- `.planning/phases/06-ratings-stats/06-CONTEXT.md` — Rating system, player_stats recalculation
- `.planning/phases/09-recurrence-automation/09-CONTEXT.md` — Email notification patterns, cron infrastructure

### Design System
- `src/lib/design-tokens.ts` — Color tokens (#2D5016 vert terrain, #4ADE80 lime accent) for OG image design
- `src/components/icons/football-icons.tsx` — FootballIcon component for OG image visuals

### Configuration
- `package.json` — @vercel/og dependency check (may need installation)
- `.env.example` — RESEND_API_KEY environment variable reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Resend email client** — Configured in `src/lib/auth.ts`, already used for magic links and recurring match notifications
- **Email template functions** — `sendRecurringMatchNotification` in `src/lib/utils/emails.ts` as reference pattern
- **Guest token handling** — `src/lib/cookies.ts` has getGuestToken and deleteGuestToken functions
- **Design tokens** — `src/lib/design-tokens.ts` with kickoff color palette
- **FootballIcon component** — `src/components/icons/football-icons.tsx` for OG image visuals

### Established Patterns
- **Server Actions in lib/actions/** — Next.js 16 requires Actions outside app/api/ directory
- **Database queries in lib/db/queries/** — Separation of queries from actions
- **Zod validation** — All inputs validated via Zod schemas
- **Guest tokens** — httpOnly cookies with 30-day expiry for guest identification
- **Player stats recalculation** — Incremental update logic exists in `src/lib/stats.ts`

### Integration Points
- **OG image route** — New API route at `/api/og` for dynamic image generation
- **Notification preferences** — New database table and queries needed
- **Email sending** — Resend.send() with existing client from auth.ts
- **Guest merge** — Update to registration flow in auth system
- **Environment variables** — Add any new vars to .env.example and vercel env

</canonical_refs>

<specifics>
## Specific Ideas

### OG Image Layout
```
┌────────────────────────────────────────────────────────────┐
│  ⚽ Match du mardi               🟢 8/14 confirmés          │
│                                                            │
│  📍 UrbanSoccer Nice                                       │
│  📅 Mar 15, 20h                                           │
│                                                            │
│                                                            │
│                                      kickoff               │
└────────────────────────────────────────────────────────────┘
```

### Email Types
1. **Waitlist promotion** — "Bonne nouvelle [prénom] ! Une place s'est libérée pour [match]. → Voir le match"
2. **Deadline reminder** — "Plus que 2h pour confirmer ta présence à [match]. → Confirmer"
3. **Post-match rating** — "Comment s'est passé [match] ? Note tes coéquipiers → [lien notation]"
4. **New recurring match** — "Le [titre] de cette semaine est ouvert ! → Confirmer ta dispo"
5. **Welcome email** — "Bienvenue sur kickoff, [prénom] ! Tu peux maintenant créer tes propres matchs."

### Guest Merge Flow
1. Guest has played 3 matches with guest_token "abc123" stored in cookie
2. Guest clicks "Créer un compte" from rating success page
3. On registration POST:
   a. Read guest_token from cookie
   b. Find all match_players where guest_token = "abc123"
   c. Update these: user_id = new user.id, guest_name = null, guest_token = null
   d. Find all ratings where rater_id or rated_id = "abc123"
   e. Update these ratings with new user.id
   f. Recalculate player_stats for this user
   g. Delete guest_token cookie
4. Redirect to /dashboard with full historical data intact

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 10-polish-production*
*Context gathered: 2026-03-31*
