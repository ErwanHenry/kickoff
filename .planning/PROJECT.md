# kickoff

## What This Is

A Progressive Web App (PWA) for organizing casual football (soccer) matches between friends. The app solves the logistical nightmare of weekly match coordination through a simple flow: Create → Invite → Confirm → Balance Teams → Play → Rate. Players can RSVP via a single WhatsApp link without creating an account, while the organizer gets intelligent team balancing based on post-match ratings.

## Core Value

**Zero-friction RSVP via shared link.** The guest flow (no account required) is the primary entry point — if that doesn't work, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Guest RSVP flow (1-tap confirmation via WhatsApp link, no account required)
- [ ] Match creation (date, time, location, player limits, recurrence)
- [ ] Team balancing algorithm (based on historical ratings: technique, physique, collectif)
- [ ] Post-match ratings (1-5 stars on 3 axes, anonymous)
- [ ] Player profiles with stats (matches played, attendance rate, average ratings)
- [ ] Groups and leaderboards (recurring match groups with player rankings)
- [ ] User accounts (email/password + magic link authentication)
- [ ] Waitlist management (automatic promotion when spots open)
- [ ] Email notifications (Resend integration for reminders and updates)
- [ ] PWA installation (installable, offline-capable)

### Out of Scope

- **Payment collection** — Phase 2 feature, adds complexity (Stripe/Lydia integration)
- **Venue booking** — Phase 3 feature, requires venue partnerships
- **Public marketplace** — Phase 3+ feature, not core to friend-group use case
- **Native iOS/Android apps** — PWA is sufficient and avoids app store approval
- **Real-time chat** — WhatsApp already handles this well
- **Advanced stats** — Goals, assists, heatmaps are overkill for casual play
- **Calendar sync** — Nice-to-have, not essential for MVP

## Context

**The Problem:**
Organizing weekly football matches between friends is a logistical headache. The organizer must manually track RSVPs on WhatsApp, chase late responders, handle last-minute cancellations, find replacements, and attempt to balance teams fairly. After the match, there's no record of who played well or how to improve future balance.

**The Solution:**
A web app that eliminates the coordination friction:
- Organizer creates a match and gets a shareable link
- Players confirm with one tap (no account required)
- Automatic waitlist management when full
- Intelligent team balancing using historical ratings
- Post-match ratings improve future balancing
- Player profiles show stats and history

**Technical Environment:**
- Next.js 15 with App Router for SSR and fast link previews
- Neon PostgreSQL serverless for multi-user concurrent access
- Drizzle ORM for type-safe database queries
- better-auth for authentication (email/password + magic link)
- shadcn/ui for accessible, pre-styled components
- Resend for transactional emails (3K free tier/month)
- Vercel for edge deployment and preview environments

**Target Users:**
- Primary: Organizers who coordinate weekly friend-group matches
- Secondary: Regular players who want to see their stats and history
- Tertiary: Occasional guests who just want to RSVP quickly

## Constraints

- **Tech Stack**: Next.js 15, Neon/Drizzle, better-auth, shadcn/ui, Tailwind v4, Resend, Vercel — stack is already proven on other projects
- **Timeline**: 4-week MVP target to validate core hypothesis (zero-friction RSVP works)
- **Budget**: Free tiers only (Neon 0.5GB, Vercel Hobby, Resend 3K/mo) — must stay within limits
- **Mobile-First**: 95% of interactions happen from WhatsApp on phone — if it doesn't work on iPhone SE, it's broken
- **Guest Flow Priority**: The without-account RSVP is the primary entry point — account creation is optional
- **French Market**: Initial users are French, but app should be language-agnostic from start

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native apps | No app store approval, instant updates, sufficient for use case | — Pending |
| Guest-first flow | Reduces friction, most players won't create accounts initially | — Pending |
| Team balancing via ratings | Differentiator vs competitors, improves match quality over time | — Pending |
| 3-axis rating system | Technique (40%), physique (30%), collectif (30%) — balanced but simple | — Pending |
| Brute-force balancing | C(14,7) = 3,432 combos, C(20,10) = 184K — both trivial for modern CPUs | — Pending |
| better-auth over NextAuth | Already used on Alignd project, magic link + email/password working | — Pending |
| Neon over Supabase | Serverless focus, simpler PostgreSQL without extra features | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after initialization*
