# STATE: kickoff

**Project:** Mobile PWA for organizing casual football matches
**Current Phase:** Phase 1 - Foundation
**Last Updated:** 2026-03-30

## Project Reference

**Core Value:** Zero-friction RSVP via shared link — guest flow (no account) is the primary entry point

**What We're Building:**
A Progressive Web App that lets organizers create football matches and share a WhatsApp link. Players RSVP with one tap (no account required). After the match, players rate teammates on 3 axes (technique, physique, collectif), which feeds into intelligent team balancing for future matches.

**Current Focus:** Setting up the technical foundation (Next.js 15, Neon/Drizzle, better-auth, PWA) so we can build the guest RSVP flow — the critical differentiator.

## Current Position

**Active Phase:** Phase 1 - Foundation
**Plan:** TBD (awaiting `/gsd:plan-phase 1`)
**Status:** Not started
**Progress:** ▱▱▱▱▱▱▱▱▱▱ 0%

## Performance Metrics

*No metrics yet — project in foundation phase*

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guest-first RSVP flow | Reduces friction, primary differentiator vs competitors | Pending validation |
| Brute-force team balancing | C(14,7) = 3,432 combos, trivial for modern CPUs | Pending implementation |
| 3-axis rating system | Technique 40%, physique 30%, collectif 30% — balanced but simple | Pending user feedback |
| better-auth over NextAuth | Proven on Alignd project, magic link + email/password | Pending implementation |
| Neon serverless over Supabase | Simpler PostgreSQL, auto-scaling for concurrent RSVPs | Pending implementation |
| PWA over native apps | No app store approval, instant updates, sufficient for use case | Pending deployment |

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

None — project ready to start Phase 1.

## Session Continuity

**Last Action:** Created ROADMAP.md with 10 phases derived from 73 requirements

**Next Action:** Execute `/gsd:plan-phase 1` to create detailed plans for Phase 1 (Foundation)

**Context for Next Session:**
- Phase 1 delivers: Next.js setup, Drizzle schema, better-auth integration, PWA config, seed script
- Critical dependency: All data operations depend on Phase 1 completion
- Research flags: Verify better-auth Drizzle adapter with Neon, verify next-pwa compatibility with Next.js 15
- Guest RSVP flow (Phase 2) is the critical path — validate core hypothesis before building advanced features

**Outstanding Questions:**
- None at foundation stage

## Progress Timeline

- **2026-03-29:** Project initialized, requirements defined, research completed
- **2026-03-30:** Roadmap created with 10 phases, 73 requirements mapped

---
*This document is updated at phase transitions and after completing major milestones*
