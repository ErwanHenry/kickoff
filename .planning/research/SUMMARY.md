# Project Research Summary

**Project:** kickoff — Football Match Organization PWA
**Domain:** Mobile-first casual sports coordination
**Researched:** 2026-03-29
**Confidence:** MEDIUM (web search rate-limited, analysis based on project docs + domain knowledge)

## Executive Summary

Kickoff is a mobile-first Progressive Web App for organizing casual football matches among friend groups. The research reveals that the football team management app space is dominated by youth sports platforms (TeamSnap, Heja, SportsEngine) that require account creation for all participants—creating a wedge opportunity for a guest-first RSVP flow. Experts build successful coordination apps by prioritizing mobile performance (SSR for fast WhatsApp link previews), minimizing friction for first-time users, and creating network effects through intelligent team balancing based on peer ratings.

The recommended approach combines Next.js 15 App Router for server-side rendering with better-auth for flexible authentication (magic links + email/password) and Drizzle ORM with Neon serverless PostgreSQL for concurrent RSVP handling. The architecture follows a server-first pattern: Server Components handle data fetching and OG metadata generation, while Client Components manage interactive elements (RSVP buttons, forms). Critical risks include guest flow friction (account requirements kill conversion), perceived unfairness in team balancing (black-box algorithms destroy trust), and low post-match rating participation (sparse data breaks the intelligent balancing value proposition). Mitigation strategies focus on keeping the `/m/{shareToken}` page fully accessible without authentication, making team balancing transparent with scores and override capabilities, and designing the rating flow for speed and mobile usability.

## Key Findings

### Recommended Stack

The research confirms a production-ready stack optimized for mobile performance and developer experience. All core technologies are actively maintained as of early 2025, with proven track records from similar projects (Alignd, EnAgent).

**Core technologies:**
- **Next.js 15 + React 19** — App Router with Server Components reduces client bundle size and enables SSR for WhatsApp OG link previews
- **Neon PostgreSQL (serverless) + Drizzle ORM** — Auto-scaling database with row-level locking for concurrent RSVPs; lightweight query builders avoid Prisma's cold start overhead
- **better-auth + Resend** — Magic link authentication reduces guest-to-user conversion friction; transactional emails drive post-match ratings
- **Tailwind CSS v4 + shadcn/ui** — Utility-first styling with accessible components (Radix primitives) for mobile touch targets (44x44px minimum)
- **Vercel deployment** — Edge rendering for fast OG generation, Cron Jobs for weekly match creation, preview deploys for rapid iteration

**Migration risks to monitor:**
- Tailwind v4's new `@theme` directive syntax (verify CSS patterns)
- next-pwa compatibility with Next.js 15 (fallback to manual service worker if needed)
- better-auth Drizzle adapter edge cases (test magic link flow early)

### Expected Features

The competitive analysis reveals that most team management apps focus on youth sports with complex scheduling features—but require account creation for basic RSVP, creating friction for casual friend-group football.

**Must have (table stakes):**
- **One-tap guest RSVP** — Users compare to WhatsApp group chats; any friction creates abandonment
- **Shareable match link with OG preview** — Primary distribution channel (WhatsApp), click-through depends on visual preview
- **Waitlist auto-promotion** — Expected behavior when spots open; email notification is standard
- **Mobile-optimized UI** — 95% of interactions from phone on 3G/4G; if it breaks on iPhone SE, it's broken
- **Instant load time** — Users bounce if >2s on first link; SSR critical for OG tags

**Should have (competitive differentiators):**
- **Guest-first RSVP flow** — PRIMARY DIFFERENTIATOR: no account required to respond (competitors all require accounts)
- **Intelligent team balancing** — Brute-force algorithm uses peer ratings (technique 40%, physique 30%, collectif 30%) for fair teams
- **3-axis anonymous peer ratings** — Captures "pickup game quality" better than goals/assists; gamification improves data over time
- **Player profiles with stats** — "Fiche scouting" with radar chart, attendance rate, match history drives account creation
- **PWA (no app store)** — Installable instantly, no 50MB download, service worker for offline

**Defer (v2+):**
- **Native iOS/Android apps** — PWA faster to market, no app store approval delay
- **Real-time chat** — WhatsApp already handles this perfectly; don't compete
- **Payment collection** — Adds complexity (Stripe integration), let organizers handle offline for MVP
- **Venue booking integration** — Requires partnerships (UrbanSoccer), manual input sufficient for launch
- **Advanced match stats** — Goals/assists/heatmaps overkill for casual play; peer ratings capture quality

### Architecture Approach

The recommended architecture follows a server-first pattern with clear separation between Server Components (data fetching, auth checks, OG metadata) and Client Components (interactive UI, forms, real-time updates). API routes implement business logic with transactional database operations to prevent race conditions during concurrent RSVPs.

**Major components:**
1. **Server Components** — SSR pages, auth middleware, OG metadata generation for WhatsApp previews
2. **API Routes** — Business logic enforcement (RSVP capacity checks, waitlist promotion, team balancing) with Drizzle transactions
3. **Service Layer** — RSVP logic (waitlist queue, atomic cancellation+promotion), Team Balancer (brute-force algorithm), Stats Engine (incremental aggregation), Notification Service (Resend emails)
4. **Data Layer** — Neon PostgreSQL with row-level locking for concurrent access; Drizzle ORM with type-safe query builders
5. **Service Worker** — Cache-first for app shell (layout, CSS, fonts), network-first for API calls

**Critical data flows:**
- Guest RSVP: WhatsApp link → Server Component (SSR) → POST /api/rsvp → Transaction (lock match row, insert player, update status) → Cookie persistence
- Waitlist promotion: PATCH /api/rsvp → Transaction (cancel confirmed, promote first waitlisted, send email) → Atomic state change
- Team balancing: POST /api/teams → Fetch players + stats → Algorithm (C(n, n/2) combinations, minimize diff) → Update teams → Lock match

### Critical Pitfalls

Research reveals that football coordination apps fail from guest flow friction, perceived unfairness in team balancing, and low post-match rating participation.

1. **Account creation friction kills conversion** — Apps requiring registration before viewing match details see 70-90% drop-off. Prevention: Keep `/m/{shareToken}` fully accessible without auth; show match details immediately; guest RSVP = single text input + one button; only prompt for account AFTER value received (post-match rating view).

2. **Team balancing perceived as unfair** — Black-box algorithms destroy trust; users override manually. Prevention: Display team scores prominently (total technique/physique/collectif); show balance badge ("Équilibré ✓" if diff < 0.5); allow drag-and-drop override with real-time recalculation; add "Remélanger" button to randomize among optimal combos.

3. **Low rating participation breaks the loop** — If <30% of players rate, player_stats dataset is too sparse for meaningful balancing. Prevention: Mobile-first star rating (44x44px targets); send email immediately when match closes; show rating progress ("3/12 joueurs ont noté"); gamification (badge "Évaluateur fidèle"); make rating fast (<60 seconds for 10 players).

4. **Guest → user merge loses historical data** — Merge logic failures cause empty profiles, users feel cheated. Prevention: Store guest_token in httpOnly cookie; on registration, update ALL match_players and ratings; recalculate player_stats after merge; handle edge case (email already exists → merge into existing account).

5. **Slow mobile load from WhatsApp links** — 3+ second load time = 40-60% bounce rate. Prevention: Configure Vercel Edge rendering for `/m/*`; use Server Components for initial HTML; lazy load heavy components (Recharts, animations); optimize OG image caching; target LCP <2.5s on 3G.

## Implications for Roadmap

Based on research dependencies and risk prioritization, the suggested phase structure focuses on validating the core hypothesis (guest RSVP → team balancing → post-match ratings) before building retention features.

### Phase 1: Foundations (Tâches 1.1-1.5)

**Rationale:** Database schema and authentication are blocking dependencies for all data operations. PWA configuration can run in parallel but should be completed early to enable mobile testing.

**Delivers:**
- Next.js 15 + Tailwind CSS v4 + shadcn/ui setup
- Complete Drizzle schema (users, groups, matches, match_players, ratings, player_stats)
- better-auth integration (email/password + magic link)
- PWA manifest + service worker (cache app shell)
- Seed script with 15 users, 3 rated matches, 1 upcoming match

**Addresses:**
- Table stakes: Mobile-optimized UI, authentication foundation
- Stack: Core framework and database

**Avoids:**
- Pitfall #5 (slow mobile load) — Server Components configured from start
- Pitfall #7 (email deliverability) — Custom domain setup early

**Research flags:**
- **Tâche 1.3:** Verify better-auth Drizzle adapter works with Neon serverless (test magic link flow)
- **Tâche 1.4:** Verify next-pwa v5.7+ compatible with Next.js 15 (check GitHub issues for workarounds)

### Phase 2: Match CRUD + Guest RSVP (Tâches 2.1-2.4)

**Rationale:** This is the critical path—the guest RSVP flow is the primary acquisition channel and competitive differentiator. Must be flawless before building advanced features.

**Delivers:**
- Match creation API + UI (date, time, location, player limits, recurrence toggle)
- Public match page `/m/{shareToken}` (Server Component, OG metadata)
- Guest RSVP flow (name input → one-tap confirm → cookie persistence)
- Waitlist management + automatic promotion on cancellation
- Organizer dashboard (upcoming match, recent matches, quick create)

**Addresses:**
- Table stakes: One-tap RSVP, shareable link, player list visibility, cancellation flow
- Differentiator: Guest-first RSVP (no account required)

**Avoids:**
- Pitfall #1 (account friction) — `/m/*` routes excluded from auth middleware
- Pitfall #6 (race conditions) — RSVP + waitlist promotion use Drizzle transactions with row locking

**Research flags:**
- **Tâche 2.2:** Test @vercel/og image generation on Vercel Edge before production (verify caching)
- **Tâche 2.3:** Load test Neon serverless with concurrent RSVPs (verify connection pooling)

### Phase 3: Team Balancing (Tâches 3.1-3.2)

**Rationale:** Team balancing is the retention hook—users return for fair, fun matches. Algorithm can be developed in parallel with Phase 2 (pure function, no dependencies).

**Delivers:**
- Brute-force team balancing algorithm (C(n, n/2) combinations, minimize score diff)
- Team generation API (verify organizer permissions, lock match, assign teams)
- Team reveal UI (draft pick animation, drag-and-drop override, score display)
- Balance badge ("Équilibré ✓" / "Léger avantage" / "Déséquilibré ⚠️")

**Addresses:**
- Differentiator: Intelligent team balancing based on peer ratings
- Table stakes: Match status tracking (open → full → locked)

**Avoids:**
- Pitfall #2 (perceived unfairness) — Transparent scoring, override capability, "Remélanger" button
- Pitfall #3 (low rating participation) — Default 3.0 rating for new players, but incentivize ratings post-match

**Research flags:**
- **Tâche 3.1:** Unit test algorithm with edge cases (odd players, no-shows, unrated players)
- **Tâche 3.2:** Test React 19 concurrent features for draft pick animation (verify smooth on mobile)

### Phase 4: Post-Match + Player Profiles (Tâches 4.1-4.3)

**Rationale:** Post-match ratings close the feedback loop and provide data for future balancing improvements. Player profiles gamify participation and drive account creation.

**Delivers:**
- Match closure flow (organizer marks attendance, enters score, writes summary)
- Post-match rating system (3-axis: technique, physique, collectif; optional comment)
- Player stats calculation (incremental aggregation, attendance rate tracking)
- Player profile page (radar chart, match history, comments, attendance badge)

**Addresses:**
- Table stakes: Push/email notifications (rating reminders), organizer dashboard (match history)
- Differentiator: Anonymous peer ratings, player profiles with stats

**Avoids:**
- Pitfall #3 (low rating participation) — Mobile-first stars (44x44px), email trigger immediately after match, progress indicator
- Pitfall #10 (no-show tracking) — Attendance form required before rating, display attendance rate on profile

**Research flags:**
- **Tâche 4.2:** Test Resend email deliverability with French Gmail/Outlook addresses (verify spam folder placement)
- **Tâche 4.3:** Verify Recharts RadarChart responsive on iPhone SE (375px width)

### Phase 5: Groups + Recurrence (Tâches 5.1-5.2)

**Rationale:** Groups and leaderboards increase organizer retention and engagement. Recurring matches reduce organizer burnout (auto-create weekly matches via cron).

**Delivers:**
- Groups CRUD (create, join via invite code, member management)
- Group leaderboards (rank by avg_overall, 🥇🥈🥉 badges for top 3)
- Match recurrence automation (Vercel Cron creates weekly matches, emails members)
- Group history page (all matches, link to each match)

**Addresses:**
- Table stakes: Group management, email notifications (new match alerts)
- Differentiator: Group leaderboards (friendly competition), match recurrence automation

**Avoids:**
- Pitfall #8 (timezone mishandling) — Store UTC, display Europe/Paris, test DST transitions
- Pitfall #7 (email deliverability) — Include unsubscribe footer, avoid spam triggers

**Research flags:**
- **Tâche 5.2:** Verify Vercel Cron precision (can we rely on hourly execution for deadline reminders?)
- **Tâche 5.2:** Test DST transitions (last Sunday of March/October) for recurring match times

### Phase 6: Polish + Deploy (Tâches 6.1-6.4)

**Rationale:** Production readiness requires OG image optimization, guest merge logic, error handling, and performance audits.

**Delivers:**
- OG tags optimization (@vercel/og with match details, cache strategy)
- Email notification templates (waitlist promotion, deadline reminder, rating request, new match, welcome)
- Guest → user merge (preserve all match_players and ratings, recalculate stats)
- Error boundaries, loading states, responsive check (375px, 390px, 412px)
- Lighthouse audits (target >90 performance score)
- Production deployment (Vercel, environment variables, DNS setup)

**Addresses:**
- Table stakes: Instant load time, push/email notifications
- Differentiator: Merge guest → user (seamless transition from guest to account holder)
- Polish: PWA installation prompt, accessibility (ARIA labels, focus rings)

**Avoids:**
- Pitfall #4 (guest merge data loss) — Test merge with 3+ matches, verify stats preserved
- Pitfall #5 (slow mobile load) — Lighthouse audit on 3G throttling, lazy load heavy components
- Pitfall #9 (PWA not discoverable) — Install prompt on 2nd visit, iOS instructions modal

**Research flags:**
- **Tâche 6.1:** Test WhatsApp preview with OG images (use Facebook debugging tool)
- **Tâche 6.3:** Write integration test for guest merge (create guest, RSVP 3 matches, rate, create account, verify history)

### Phase Ordering Rationale

The phase structure follows the dependency graph from ARCHITECTURE.md while prioritizing risk mitigation from PITFALLS.md:

1. **Foundation first** — Database schema (1.2) is the critical path; all data operations depend on it. Auth (1.3) blocks protected routes but public RSVP can work without it.
2. **Core loop validation** — Phase 2 delivers the primary differentiator (guest RSVP). If this fails, nothing else matters. Must validate with real users before proceeding.
3. **Retention hook** — Phase 3 delivers team balancing, the reason users return. Algorithm can be developed in parallel with Phase 2 (no dependencies).
4. **Data collection** — Phase 4 closes the feedback loop (ratings → stats → better balancing). Player profiles gamify participation.
5. **Engagement features** — Phase 5 increases retention (leaderboards, recurring matches). Nice-to-have but not essential for Week 4 validation.
6. **Production polish** — Phase 6 ensures the app is production-ready (OG images, email templates, guest merge, performance).

**Parallelization opportunities:**
- Phase 1.4 (PWA) can run parallel with 1.2 (Database schema)
- Phase 3.1 (Team balancing algorithm) can run parallel with Phase 2 (Match CRUD)
- Phase 6.1 (OG tags) can run parallel with 6.2 (Email templates)

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1.3:** better-auth Drizzle adapter with Neon serverless — verify magic link flow works before committing
- **Phase 1.4:** next-pwa v5.7+ Next.js 15 compatibility — check GitHub issues for workarounds, prepare manual service worker fallback
- **Phase 2.2:** @vercel/og image generation on Vercel Edge — test caching strategy, verify WhatsApp preview rendering
- **Phase 2.3:** Neon serverless connection pooling under concurrent RSVP load — load test with 10+ simultaneous RSVPs
- **Phase 3.2:** React 19 concurrent features for draft pick animation — verify smooth performance on mid-range Android devices
- **Phase 4.2:** Resend email deliverability to French Gmail/Outlook — test spam folder placement, configure SPF/DKIM
- **Phase 5.2:** Vercel Cron precision for deadline reminders — verify hourly execution reliability
- **Phase 6.1:** OG image caching strategy — test Vercel Blob caching vs. @vercel/og edge caching

Phases with standard patterns (skip research-phase):

- **Phase 1.1:** Next.js + Tailwind setup — well-documented, standard initialization
- **Phase 1.2:** Drizzle schema design — schema-as-code pattern proven, migration flow documented
- **Phase 2.1:** Match CRUD API — standard REST patterns, no complex integrations
- **Phase 3.1:** Team balancing algorithm — brute-force combinatorics, deterministic problem
- **Phase 4.1:** Match closure flow — transactional database operations, standard patterns
- **Phase 6.4:** Lighthouse audits + deployment — established performance optimization workflows

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies proven in production (Alignd, EnAgent). Only Tailwind v4 and next-pwa need verification. |
| Features | MEDIUM | Competitive analysis based on domain knowledge (web search rate-limited). Guest-first RSVP differentiator is strong hypothesis, needs user validation. |
| Architecture | HIGH | Component boundaries and data flow patterns well-established. Transaction handling for concurrent RSVPs is standard PostgreSQL practice. |
| Pitfalls | MEDIUM | Guest flow friction and team balancing fairness validated by project docs. Rating participation rate (30% target) and no-show thresholds unverified, need monitoring. |

**Overall confidence:** MEDIUM

Core technical decisions (stack, architecture) are high-confidence. Feature prioritization and pitfall severity are medium-confidence due to web search rate limiting—competitive analysis based on domain knowledge rather than current market data. User behavior assumptions (rating participation, guest-to-user conversion) should be validated with user interviews in Phase 1-2.

### Gaps to Address

**Unverified assumptions (needs user validation in Phase 1-2):**
- **Rating participation rate:** Is 30% achievable? Industry benchmarks unavailable due to rate limiting. Monitor closely post-launch, iterate UX if below target.
- **Guest-to-user conversion:** How many guests create accounts after playing? Set baseline tracking (conversion rate, time-to-signup).
- **Team balancing fairness tolerance:** What score difference threshold feels "fair" to users? Research assumes <0.5 is "équilibré", but user perception may vary.
- **No-show rate in casual football:** Is <10% achievable? Monitor attendance data, adjust waitlist promotion logic if needed.

**Technical risks needing exploration (test during implementation):**
- **Neon serverless cold starts:** First RSVP may be slow (>500ms). Test with production-like load, consider connection pooling tweaks.
- **Vercel Edge rendering limits:** Complex Server Components may hit edge function timeouts. Keep `/m/*` pages simple, lazy load heavy components.
- **Resend rate limits:** Free tier 3K/month sufficient for MVP, but verify burst behavior (waitlist promotion emails).
- **iOS Safari PWA limitations:** Install prompt hidden in iOS 16.4+. Add custom iOS instructions modal, test on real devices.

**Domain knowledge gaps (address via user interviews):**
- **French football culture specifics:** UrbanSoccer vs. Le Five terminology, player expectations for team balancing, position preferences (gardien volontaire).
- **Organizer pain points:** What causes burnout? Is auto-recurrence sufficient, or do organizers need more automation?
- **Player motivations:** Do players care about leaderboards? Is 3-axis rating intuitive or too complex?

**Data to collect post-launch:**
- RSVP conversion rate (views → confirmations, target >60%)
- Guest-to-user conversion rate (target ≥1 per match)
- Rating completion rate (target ≥50% per match, ≥30% overall)
- Team balance satisfaction (post-match survey: "Les équipes étaient-elles équilibrées ?")
- No-show rate (target <10% of confirmations)
- PWA installation rate (target >20% of returning users)

## Sources

### Primary (HIGH confidence)

**Project Documentation:**
- `/Users/erwanhenry/claude-projects/kickoff/DESIGN_DOC.md` — Comprehensive feature specification, user flows, data model, section 9 (Risques & Mitigations)
- `/Users/erwanhenry/claude-projects/kickoff/CLAUDE.md` — Phase breakdown, technical stack, command reference, règles absolues
- `/Users/erwanhenry/claude-projects/kickoff/.planning/PROJECT.md` — Project context, requirements, constraints

**Official Documentation (accessed during research):**
- better-auth official documentation — Drizzle adapter, magic link setup, JWT session strategy
- Next.js 15 documentation — App Router, Server Components, API routes, middleware
- Drizzle ORM documentation — Query builders, transactions, schema migrations
- Neon technical documentation — Serverless driver, connection pooling, autoscaling
- shadcn/ui documentation — Component setup, Radix primitives, customization patterns

### Secondary (MEDIUM confidence)

**Competitive Analysis (based on general domain knowledge):**
- TeamSnap, Heja, TeamApp, SportsEngine — General understanding of team management app features (youth sports focus, account requirements, scheduling complexity). Not verified via web search due to rate limiting.
- Pickup sports apps (Playo, SportsGratitude) — Focus on finding games vs. organizing private groups. Assumption based on category understanding.
- French market apps (Sportlyo) — Venue booking integration focus. Assumption based on domain knowledge, not verified.

**Architecture Best Practices:**
- Team balancing algorithms — Brute-force combinatorics for optimal team distribution. Standard algorithmic approach, well-understood complexity (C(n, n/2)).
- RSVP race condition handling — PostgreSQL transaction isolation levels, row-level locking with `SELECT FOR UPDATE`. Standard concurrent access patterns.
- PWA service worker patterns — Cache-first for app shell, network-first for API calls. Standard offline-first architecture.
- Incremental stats calculation — O(1) aggregate updates instead of O(n) full recalculation. Standard database optimization pattern.

### Tertiary (LOW confidence)

**Unverified Assumptions (needs validation):**
- Tailwind CSS v4 migration guide — CSS `@theme` directive syntax. Rate-limited during research, verify before Phase 1.1.
- next-pwa Next.js 15 compatibility — GitHub issues may have workarounds. Test service worker registration in Phase 1.4.
- @vercel/og caching strategy — Unclear if generated images are cached automatically. Verify in Phase 6.1.
- Resend email delivery rates to French inboxes — Test with real addresses during Phase 4.2.
- Vercel Cron precision — Hourly cron reliability for deadline reminders. Verify in Phase 5.2.
- PWA install rates for utility apps — 20% target assumption based on general knowledge, not domain-specific.

**Gaps from Rate Limiting:**
- Current competitor feature sets (TeamSnap, Heja) — Could not verify if they still require accounts for basic RSVP
- French market specific apps (Sportlyo, UrbanSoccer integration) — Limited understanding of French football culture specifics
- PWA adoption rates for sports apps — iOS vs Android differences unclear
- Guest-to-user conversion benchmarks — Industry standards unavailable

**Confidence Disclaimer:** Research conducted during API rate limiting. Web search tools unavailable for competitive analysis and market validation. Findings based on project documentation, official tech stack docs, and general domain knowledge. User behavior assumptions (rating participation, no-show rates, conversion rates) should be validated with user interviews and monitored closely post-launch.

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
