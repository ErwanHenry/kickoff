---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 9
status: executing
last_updated: "2026-03-31T19:25:00.000Z"
progress:
  total_phases: 11
  completed_phases: 9
  total_plans: 31
  completed_plans: 28
  percent: 84
---

# STATE: kickoff

**Project:** Mobile PWA for organizing casual football matches
**Current Phase:** 9
**Last Updated:** 2026-03-31

## Project Reference

**Core Value:** Zero-friction RSVP via shared link — guest flow (no account) is the primary entry point

**What We're Building:**
A Progressive Web App that lets organizers create football matches and share a WhatsApp link. Players RSVP with one tap (no account required). After the match, players rate teammates on 3 axes (technique, physique, collectif), which feeds into intelligent team balancing for future matches.

**Current Focus:** Phase 09 — Recurrence & Automation

## Current Position

Phase: 09 (Recurrence & Automation) — EXECUTING
Plan: 09-02 (Email Notifications for Recurring Matches) — COMPLETE
Plans: 2/3 executing
**Status:** In progress
**Progress:** [████████░░] 84%

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01.1 | 01-01 | ~15 min | 5 | 5 |
| 01.1 | 01-02a | ~10 min | 5 | 3 |
| 01.1 | 01-02b | ~12 min | 5 | 8 |
| 01.1 | 01-02c | ~8 min | 3 | 3 |
| Phase 04 P01 | 7 | 5 tasks | 5 files |
| Phase 06 P01 | 1774945420 | 4 tasks | 5 files |
| Phase 06 P02 | ~8 min | 4 tasks | 4 files |
| Phase 06 P03 | 0 | 4 tasks | 5 files |
| Phase 07-player-profiles P01 | ~20 min | 6 tasks | 6 files |
| Phase 07 P02 | 1255 | 3 tasks | 10 files |
| Phase 08 P01 | ~25 min | 4 tasks | 5 files |
| Phase 08 P02 | ~30 min | 5 tasks | 6 files |
| Phase 08 P03 | ~26 min | 6 tasks | 7 files |
| Phase 09 P01 | ~5 min | 5 tasks | 6 files |
| Phase 09 P02 | 198 | 2 tasks | 3 files |

## Accumulated Context

### Roadmap Evolution

- **Phase 1.1 inserted after Phase 1:** Setup Design System — Fonts (DM Sans, Space Mono), couleurs (pitch, lime, chalk), icônes football, et tokens réutilisables. Fichiers préparés dans `addentum/`. (2026-03-31)

### Key Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guest-first RSVP flow | Reduces friction, primary differentiator vs competitors | Implemented ✅ |
| Brute-force team balancing | C(14,7) = 3,432 combos, trivial for modern CPUs | Pending implementation |
| 3-axis rating system | Technique 40%, physique 30%, collectif 30% — balanced but simple | Pending user feedback |
| better-auth over NextAuth | Proven on Alignd project, magic link + email/password | Implemented ✅ |
| Neon serverless over Supabase | Simpler PostgreSQL, auto-scaling for concurrent RSVPs | Implemented ✅ |
| PWA over native apps | No app store approval, instant updates, sufficient for use case | Implemented ✅ |
| shadcn/ui new-york style | Plan specified, maintains consistent component aesthetics | Implemented ✅ |
| Toaster position top-center | Visible above virtual keyboard on mobile | Implemented ✅ |
| FOR UPDATE locking for concurrency | Coordinates RSVP and waitlist promotion, prevents race conditions | Implemented ✅ |
| FIFO waitlist via confirmedAt | First come, first served ordering is fair and intuitive | Implemented ✅ |
| Server Actions in lib/actions/ | Next.js 16 requires Actions outside app/api/ directory | Implemented ✅ |
| Mobile dashboard with bottom nav | Touch-friendly navigation for mobile users | Implemented ✅ |
| Numeric slug suffixes over nanoid | More user-friendly: "foot-du-mardi-2" vs "foot-du-mardi-xY9k" | Implemented ✅ |
| Function props cannot pass Server→Client | Client components must handle own navigation after actions | Implemented ✅ |
| Vercel Cron for recurrence | Serverless cron jobs eliminate need for external services | Implemented ✅ |
| Weekly recurrence via parent/child | Parent match recurs, children are one-time occurrences | Implemented ✅ |
| No auto-confirm for recurring matches | Players must RSVP weekly to measure reliability | Implemented ✅ |

### Technical Stack Confirmed

- **Framework:** Next.js 15 with App Router (SSR for WhatsApp OG previews)
- **Database:** Neon PostgreSQL serverless + Drizzle ORM
- **Auth:** better-auth (email/password + magic link)
- **UI:** Tailwind CSS v4 + shadcn/ui (accessible components)
- **Email:** Resend (3K free tier/month)
- **Hosting:** Vercel (Edge rendering, Cron jobs)
- **Date Utilities:** date-fns (addWeeks for recurrence)

### Architecture Patterns Established

- **Server Components** for data fetching and OG metadata
- **Client Components** for interactive elements (RSVP buttons, forms)
- **API Routes** with Drizzle transactions for race condition prevention
- **Service Worker** cache-first for app shell, network-first for API calls
- **Cron Endpoints** protected by CRON_SECRET header validation
- **Recurring Matches** parent/child relationship with inherited settings

### Known Risks & Mitigations

| Risk | Mitigation | Status |
|------|-----------|--------|
| Guest flow friction (account requirements) | Keep /m/{shareToken} fully accessible without auth | Active in Phase 2 |
| Team balancing perceived as unfair | Display scores transparently, allow manual override | Active in Phase 4 |
| Low rating participation (<30%) | Mobile-first stars, email triggers, progress indicator | Active in Phase 6 |
| Guest → user merge data loss | Test merge with 3+ matches, verify stats preserved | Active in Phase 10 |
| Slow mobile load from WhatsApp | SSR, Edge rendering, lazy load heavy components | Active in Phase 2 |
| Duplicate recurring matches | Query checks for existing child before creation | Resolved ✅ |
| Cron endpoint security | CRON_SECRET header validation with logging | Resolved ✅ |

### Current Blockers

None — Phase 09 Plan 02 complete, ready for Phase 10 (Guest → User Merge) or remaining Phase 09 plans.

## Session Continuity

**Last Action:** Completed Plan 09-02 (Email Notifications for Recurring Matches)

**Next Action:** Execute remaining Phase 09 plans (if any) or proceed to Phase 10

**Context for Next Session:**

- Phase 09 Plan 01 delivers: Vercel Cron configuration, recurrence queries, Server Action for child match creation, cron endpoint with security
- Phase 09 Plan 02 delivers: Email notification function with branded HTML template, cron integration with error handling
- sendRecurringMatchNotification sends emails to group members with French locale date formatting
- Cron endpoint calls email function after match creation, logs errors but doesn't stop execution
- Email template uses kickoff brand colors (pitch #2D5016, chalk #F8FAF5) with responsive 400px container
- Empty recipients check prevents Resend quota waste
- Resend client exported from src/lib/auth.ts for reuse
- TypeScript compilation passes, all verification checks pass

**Outstanding Questions:**

- None

## Progress Timeline

- **2026-03-29:** Project initialized, requirements defined, research completed
- **2026-03-30:** Roadmap created with 10 phases, 73 requirements mapped
- **2026-03-30:** Plan 01-01 complete - Next.js 15 + Tailwind v4 + TypeScript strict (commit 5052509)
- **2026-03-30:** Plan 01-02 complete - shadcn/ui with 11 components + Sonner toast (commits 00d8af3, 1390e53, a2c4631)
- **2026-03-30:** Plan 01-03 complete - Drizzle ORM + Neon serverless + complete schema (commit 3f4dcf9)
- **2026-03-30:** Phase 02 complete - Match creation, guest RSVP, waitlist promotion, dashboard (10 plans, 695s total)
- **2026-03-30:** Plan 02-03 complete - Waitlist promotion + dashboard (commits 2af8e0f, bb81f57, ada682d, 87ae889, 8754b63, 9300fc9)
- **2026-03-31:** Phase 01.1 complete - Setup Design System (4 plans)
  - 01.1-01-PLAN: Fonts (DM Sans, Space Mono), Tailwind theme extensions, FootballIcon component, design-tokens library
  - 01.1-02a-PLAN: CSS variables mapped to kickoff colors (pitch, lime, chalk, etc.)
  - 01.1-02b-PLAN: Lucide icons replaced with FootballIcon for domain concepts, font-mono applied to data labels
  - 01.1-02c-PLAN: StatusBadges token integrated, shadow-card and rounded-card applied
- **2026-03-31:** Phase 08 complete - Groups & Leaderboards (3 plans)
  - 08-01: Group creation with invite codes, numeric slug suffixes
  - 08-02: Group pages with leaderboard, match history, member list
  - 08-03: Group joining via invite codes, match-group association, groups dashboard
- **2026-03-31:** Phase 09 Plan 01 complete - Vercel Cron Infrastructure (commit b2a0fcc)
  - Added Vercel Cron configuration to vercel.json (daily at midnight UTC)
  - Added CRON_SECRET to .env.example for cron endpoint security
  - Created getParentMatchesNeedingNextOccurrence query to find parent matches
  - Created createRecurringMatchOccurrence Server Action for child match creation
  - Created /api/cron/recurring-matches endpoint with CRON_SECRET validation
  - All 18 test stubs pass, TypeScript compilation passes
- **2026-03-31:** Phase 09 Plan 02 complete - Email Notifications for Recurring Matches (commits ecc3a3f, 44107d3, a364893)
  - Created sendRecurringMatchNotification function in src/lib/utils/emails.ts
  - Branded HTML template with kickoff colors (pitch green header, chalk background)
  - French locale date formatting using date-fns (e.g., "8 avril 2026 20:00")
  - Empty recipients check prevents Resend quota waste
  - Cron endpoint integrated with email sending after match creation
  - Nested try/catch for email errors: logged but don't stop cron execution
  - Exported resend client from src/lib/auth.ts for reuse
  - TypeScript compilation passes, all verification checks pass

---
*This document is updated at phase transitions and after completing major milestones*
