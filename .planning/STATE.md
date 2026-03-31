---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 04
status: verifying
last_updated: "2026-03-31T07:49:43.119Z"
progress:
  total_phases: 11
  completed_phases: 5
  total_plans: 20
  completed_plans: 16
  percent: 80
---

# STATE: kickoff

**Project:** Mobile PWA for organizing casual football matches
**Current Phase:** 04
**Last Updated:** 2026-03-31

## Project Reference

**Core Value:** Zero-friction RSVP via shared link — guest flow (no account) is the primary entry point

**What We're Building:**
A Progressive Web App that lets organizers create football matches and share a WhatsApp link. Players RSVP with one tap (no account required). After the match, players rate teammates on 3 axes (technique, physique, collectif), which feeds into intelligent team balancing for future matches.

**Current Focus:** Phase 04 — Team Balancing

## Current Position

Phase: 04 (Team Balancing) — EXECUTING
Plan: 1 of 1
Plans: 4/4 executed
**Status:** Phase complete — ready for verification
**Progress:** [████████░░] 80%

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01.1 | 01-01 | ~15 min | 5 | 5 |
| 01.1 | 01-02a | ~10 min | 5 | 3 |
| 01.1 | 01-02b | ~12 min | 5 | 8 |
| 01.1 | 01-02c | ~8 min | 3 | 3 |
| Phase 04 P01 | 7 | 5 tasks | 5 files |

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

### Technical Stack Confirmed

- **Framework:** Next.js 15 with App Router (SSR for WhatsApp OG previews)
- **Database:** Neon PostgreSQL serverless + Drizzle ORM
- **Auth:** better-auth (email/password + magic link)
- **UI:** Tailwind CSS v4 + shadcn/ui (accessible components)
- **Email:** Resend (3K free tier/month)
- **Hosting:** Vercel (Edge rendering, Cron jobs)

### Architecture Patterns Established

- **Server Components** for data fetching and OG metadata
- **Client Components** for interactive elements (RSVP buttons, forms)
- **API Routes** with Drizzle transactions for race condition prevention
- **Service Worker** cache-first for app shell, network-first for API calls

### Known Risks & Mitigations

| Risk | Mitigation | Status |
|------|-----------|--------|
| Guest flow friction (account requirements) | Keep /m/{shareToken} fully accessible without auth | Active in Phase 2 |
| Team balancing perceived as unfair | Display scores transparently, allow manual override | Active in Phase 4 |
| Low rating participation (<30%) | Mobile-first stars, email triggers, progress indicator | Active in Phase 6 |
| Guest → user merge data loss | Test merge with 3+ matches, verify stats preserved | Active in Phase 10 |
| Slow mobile load from WhatsApp | SSR, Edge rendering, lazy load heavy components | Active in Phase 2 |

### Current Blockers

None — Phase 02 complete, ready for Phase 03 (Team Balancing).

## Session Continuity

**Last Action:** Completed Plan 02-03 (Waitlist Promotion + Dashboard)

**Next Action:** Execute Plan 03-01 (Team Balancing Algorithm)

**Context for Next Session:**

- Phase 02 delivers: Match creation form, public match page, guest RSVP flow, waitlist management, dashboard
- Waitlist promotion uses FOR UPDATE locking to coordinate with concurrent RSVP operations
- Dashboard provides central hub for match management with upcoming/recent views
- Server Actions in lib/actions/, queries in lib/db/queries/
- Mobile-first UI with max-w-2xl container pattern
- Critical dependency: Team balancing (Phase 03) depends on player ratings data structure

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

---
*This document is updated at phase transitions and after completing major milestones*
