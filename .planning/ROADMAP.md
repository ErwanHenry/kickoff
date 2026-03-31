# ROADMAP: kickoff

**Created:** 2026-03-30
**Granularity:** Fine
**Coverage:** 73/73 requirements mapped
**Phases:** 11

## Phases

- [x] **Phase 1: Foundation** - Project setup, database schema, authentication, PWA configuration
- [x] **Phase 1.1: Setup Design System** - Fonts, colors, icons, design tokens
- [ ] **Phase 2: Match Creation & Guest RSVP** - Core CRUD, public match page, zero-friction guest flow
- [ ] **Phase 3: Waitlist & Dashboard** - Automatic promotion, organizer dashboard
- [ ] **Phase 4: Team Balancing** - Algorithm, team generation UI, balance indicators
- [ ] **Phase 5: Post-Match Closure** - Attendance tracking, scoring, match summary
- [ ] **Phase 6: Ratings & Stats** - 3-axis rating system, player stats calculation
- [ ] **Phase 7: Player Profiles** - Stats display, radar charts, match history, comments
- [ ] **Phase 8: Groups & Leaderboards** - Group management, invite codes, rankings
- [ ] **Phase 9: Recurrence & Automation** - Weekly match creation, cron jobs
- [ ] **Phase 10: Polish & Production** - OG images, email notifications, guest merge, deploy

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 7/7 | Complete | 2026-03-30 |
| 1.1. Setup Design System | 4/4 | Complete | 2026-03-31 |
| 2. Match Creation & Guest RSVP | 1/3 | In Progress|  |
| 3. Waitlist & Dashboard | 2/3 | In Progress|  |
| 4. Team Balancing | 0/1 | Planning | - |
| 5. Post-Match Closure | 1/1 | Planning | - |
| 6. Ratings & Stats | 3/3 | Complete | 2026-03-31 |
| 7. Player Profiles | 0/2 | Planning | - |
| 8. Groups & Leaderboards | 0/3 | Not started | - |
| 9. Recurrence & Automation | 0/2 | Not started | - |
| 10. Polish & Production | 0/4 | Not started | - |

## Phase Details

### Phase 1: Foundation

**Goal:** Users can access the application and organizers can create accounts, while the technical infrastructure is ready for feature development.

**Depends on:** Nothing

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, PWA-01, PWA-02, PWA-03, PWA-04

**Success Criteria** (what must be TRUE):
1. User can create account with email/password and log in
2. User can request magic link via email and access their account
3. User session persists across browser refresh
4. App is installable as PWA with manifest and service worker
5. Database schema supports all planned data models

**Plans:** 7 plans in 6 waves

| Wave | Plan | Objective |
|------|------|-----------|
| 0 | 01-01-PLAN.md | Next.js 15 project init with TypeScript + Tailwind v4 |
| 0 | 01-02-PLAN.md | shadcn/ui components setup |
| 1 | 01-03-PLAN.md | Drizzle ORM + complete database schema |
| 2 | 01-04-PLAN.md | better-auth with email/password + magic link |
| 3 | 01-05-PLAN.md | Auth UI (tabbed login/register) |
| 4 | 01-06-PLAN.md | PWA manifest + service worker |
| 5 | 01-07-PLAN.md | Landing page + dashboard placeholder |

**UI hint:** yes

---

### Phase 01.1: Setup Design System (INSERTED)

**Goal:** Establish design system foundation — fonts, colors, icons, and tokens for subsequent UI phases.
**Requirements**: UI-SPEC (see .planning/phases/01.1-setup-design-system/01.1-UI-SPEC.md)
**Depends on:** Phase 1
**Plans:** 4 plans in 4 focused phases

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 01.1-01-PLAN.md | Setup Design System Foundation (fonts, Tailwind extend, FootballIcon, design-tokens, CLAUDE.md docs) |
| 2 | 01.1-02a-PLAN.md | Retrofit Colors & Backgrounds (replace hardcoded hex with kickoff palette) |
| 3 | 01.1-02b-PLAN.md | Retrofit Icons & Typography (FootballIcon for domain concepts, mono for data) |
| 4 | 01.1-02c-PLAN.md | Retrofit Tokens & Badges (statusBadges, attendanceBadge, shadows, border-radius) |

**UI hint:** yes (see 01.1-UI-SPEC.md)

### Phase 2: Match Creation & Guest RSVP

**Goal:** Organizers can create matches and share links, while guests can RSVP without creating an account (primary differentiator).

**Depends on:** Phase 1

**Requirements:** MATCH-01, MATCH-02, MATCH-04, MATCH-05, MATCH-06, MATCH-07, GUEST-01, GUEST-02, GUEST-03, GUEST-04, GUEST-05, GUEST-06, GUEST-07, WAIT-01, WAIT-03, WAIT-04, SHARE-03

**Success Criteria** (what must be TRUE):
1. Organizer can create match with date, time, location, player limits, deadline
2. Match generates shareable link (/m/{shareToken}) that works on WhatsApp
3. Guest can view match page and RSVP with first name only (no account)
4. Guest returning sees their RSVP status and can cancel
5. Guest automatically waitlisted when match is full, sees position
6. Waitlisted players auto-promoted when spots open (FIFO)
7. Match page loads in <1s on 3G connection
8. Match status progresses correctly (draft → open → full)
9. Organizer dashboard shows upcoming and recent matches

**Plans:** 1/3 plans executed

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 02-01-PLAN.md | Match creation form (card sections, Zod validation, draft + publish workflow) |
| 1 | 02-02-PLAN.md | Public match page with guest RSVP (httpOnly cookies, waitlist, race condition prevention) |
| 2 | 02-03-PLAN.md | Waitlist promotion + organizer dashboard (upcoming/recent matches) |

**UI hint:** yes

---

### Phase 3: Waitlist & Dashboard

**Goal:** Waitlisted players are automatically promoted when spots open, and organizers have a central dashboard to manage matches.

**Depends on:** Phase 2

**Requirements:** WAIT-01, MATCH-07

**Success Criteria** (what must be TRUE):
1. When confirmed player cancels, first waitlisted player auto-promotes
2. Match status changes from full → open when spot available, back to full when refilled
3. Organizer sees upcoming match with confirmed count on dashboard
4. Organizer can navigate to recent matches and create new matches from dashboard

**Plans:** 2/3 plans executed

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 03-01-PLAN.md | Waitlist promotion API with FOR UPDATE locking |
| 2 | 03-02-PLAN.md | Organizer dashboard with upcoming/recent matches |

**UI hint:** yes

---

### Phase 4: Team Balancing

**Goal:** Organizers can generate balanced teams using historical ratings, with manual override capability.

**Depends on:** Phase 2

**Requirements:** BALANCE-01, BALANCE-02, BALANCE-03, BALANCE-04, BALANCE-05, BALANCE-06, BALANCE-07

**Success Criteria** (what must be TRUE):
1. System generates balanced teams using brute-force algorithm
2. Algorithm uses player scores (technique 40%, physique 30%, collectif 30%)
3. New players without ratings default to 3.0 on all axes
4. Organizer can view team assignments with total scores per team
5. Organizer can manually drag-and-drop players between teams
6. Teams display balance indicator (Equilibre / Leger avantage / Desequilibre)
7. Match locks when teams are finalized

**Plans:** 1 plan in 1 wave (consolidated from original 3 plans — algorithm, Server Actions, and UI components already exist)

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 04-01-PLAN.md | Complete team balancing feature (add getMatchTeams query, update teams page, apply design system to UI components) |

**Note:** The team balancing algorithm (brute-force + serpentine), Server Actions (generateTeams, reassignPlayer), and UI components (TeamReveal, BalanceIndicator, DraggablePlayerCard) are already implemented. This plan adds the missing database query and applies the design system.

**UI hint:** yes

---

### Phase 5: Post-Match Closure

**Goal:** Organizers can close matches by marking attendance and entering scores.

**Depends on:** Phase 2

**Requirements:** POST-01, POST-02, POST-03, POST-04, POST-05

**Success Criteria** (what must be TRUE):
1. Organizer can mark each player as present or absent
2. Organizer can enter final score (Team A - Team B)
3. Organizer can add optional match summary
4. Match status changes to "played" when closed
5. Players marked absent receive "no_show" status

**Plans:** 1 plan in 1 wave

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 05-01-PLAN.md | Attendance marking form + score entry + match closure Server Action |

**UI hint:** yes

---

### Phase 6: Ratings & Stats

**Goal:** Players can rate teammates on 3 axes, and player statistics are recalculated incrementally.

**Depends on:** Phase 5

**Requirements:** RATE-01, RATE-02, RATE-03, RATE-04, RATE-05, RATE-06, RATE-07, RATE-08

**Success Criteria** (what must be TRUE):
1. Player can rate teammates on 3 axes (technique, physique, collectif) with 1-5 stars
2. Player can add optional comment (max 280 chars)
3. Ratings are anonymous (rated player sees averages, not rater)
4. Guest can rate matches they participated in (via guest token)
5. User can rate matches they participated in (via session)
6. Player cannot rate same teammate more than once per match
7. Player stats recalculate incrementally after each rating
8. Match status changes to "rated" when ≥50% of players rated

**Plans:** 3 plans in 3 waves (COMPLETE)

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 06-01-PLAN.md | Rating infrastructure (schema, queries, submitRatings Server Action) |
| 2 | 06-02-PLAN.md | Rating UI (RatingForm, PlayerRatingCard, StarInput, rating pages) |
| 3 | 06-03-PLAN.md | Stats recalculation (incremental updates, match status tracking, progress indicator) |

**UI hint:** yes

---

### Phase 7: Player Profiles

**Goal:** Players can view detailed stats, match history, and comments from teammates.

**Depends on:** Phase 6

**Requirements:** PROFILE-01, PROFILE-02, PROFILE-03, PROFILE-04, PROFILE-05, PROFILE-06, PROFILE-07, PROFILE-08

**Success Criteria** (what must be TRUE):
1. Profile displays matches played count
2. Profile displays attendance rate with color badge (green ≥90%, yellow 70-89%, red <70%)
3. Profile displays overall rating (avg of 3 axes)
4. Profile displays radar chart of 3 rating axes
5. Profile displays last match date (relative: "il y a 3 jours")
6. Profile displays match history (last 10 matches with results)
7. Profile displays anonymous comments received
8. Guest sees CTA to create account after rating

**Plans:** 2 plans in 2 waves

| Wave | Plan | Objective |
|------|------|-----------|
| 1 | 07-01-PLAN.md | Player profile page (queries, stats overview, radar chart, match history, comments) |
| 2 | 07-02-PLAN.md | Profile navigation integration (guest CTA, profile links from player lists) |

**Note:** Phase 7 depends on Phase 6 (Ratings & Stats) for player_stats data and rating queries. Recharts radar chart displays 3 axes (technique, physique, collectif).

**UI hint:** yes

---

### Phase 8: Groups & Leaderboards

**Goal:** Organizers can create groups with invite codes, and players can view leaderboards ranked by skill.

**Depends on:** Phase 2

**Requirements:** GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05, GROUP-06, GROUP-07, GROUP-08, MATCH-08

**Success Criteria** (what must be TRUE):
1. Organizer can create group with name and auto-generated slug
2. Group generates unique invite code
3. Organizer can invite players via link with invite code
4. User can join group via invite code
5. Group displays leaderboard (players ranked by avg_overall)
6. Leaderboard shows top 3 with medals badges
7. Group displays match history
8. Group can have multiple organizers
9. Match can be associated with a group

**Plans:** TBD

**UI hint:** yes

---

### Phase 9: Recurrence & Automation

**Goal:** Weekly recurring matches are automatically created via cron, and group members are notified.

**Depends on:** Phase 8

**Requirements:** RECUR-01, RECUR-02, RECUR-03, RECUR-04, MATCH-03

**Success Criteria** (what must be TRUE):
1. Weekly recurring match auto-creates next occurrence via cron
2. New occurrence inherits parent match settings (time, location, limits)
3. Group members receive email when new occurrence created
4. Players are NOT auto-confirmed (must RSVP each week)
5. Organizer can set match recurrence (none / weekly)

**Plans:** TBD

**UI hint:** yes

---

### Phase 10: Polish & Production

**Goal:** App is production-ready with optimized sharing, email notifications, and seamless guest-to-user conversion.

**Depends on:** Phase 6, Phase 9

**Requirements:** AUTH-05, SHARE-01, SHARE-02, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05

**Success Criteria** (what must be TRUE):
1. Match link generates OG preview for WhatsApp with match info image
2. Waitlisted player receives email when promoted to confirmed
3. Player receives reminder email 2h before confirmation deadline
4. Players receive email after match to rate teammates
5. Group members receive email when new weekly match created
6. New user receives welcome email after account creation
7. Guest can create account and merge all match history
8. App is deployed to production with all features working

**Plans:** TBD

**UI hint:** yes

---

## Coverage Map

| Requirement | Phase | Requirement | Phase |
|-------------|-------|-------------|-------|
| AUTH-01 | 1 | AUTH-02 | 1 |
| AUTH-03 | 1 | AUTH-04 | 1 |
| AUTH-05 | 10 | MATCH-01 | 2 |
| MATCH-02 | 2 | MATCH-03 | 9 |
| MATCH-04 | 2 | MATCH-05 | 2 |
| MATCH-06 | 2 | MATCH-07 | 2 |
| MATCH-08 | 8 | GUEST-01 | 2 |
| GUEST-02 | 2 | GUEST-03 | 2 |
| GUEST-04 | 2 | GUEST-05 | 2 |
| GUEST-06 | 2 | GUEST-07 | 2 |
| WAIT-01 | 2 | WAIT-02 | 10 |
| WAIT-03 | 2 | WAIT-04 | 2 |
| BALANCE-01 | 4 | BALANCE-02 | 4 |
| BALANCE-03 | 4 | BALANCE-04 | 4 |
| BALANCE-05 | 4 | BALANCE-06 | 4 |
| BALANCE-07 | 4 | POST-01 | 5 |
| POST-02 | 5 | POST-03 | 5 |
| POST-04 | 5 | POST-05 | 5 |
| RATE-01 | 6 | RATE-02 | 6 |
| RATE-03 | 6 | RATE-04 | 6 |
| RATE-05 | 6 | RATE-06 | 6 |
| RATE-07 | 6 | RATE-08 | 6 |
| PROFILE-01 | 7 | PROFILE-02 | 7 |
| PROFILE-03 | 7 | PROFILE-04 | 7 |
| PROFILE-05 | 7 | PROFILE-06 | 7 |
| PROFILE-07 | 7 | PROFILE-08 | 7 |
| GROUP-01 | 8 | GROUP-02 | 8 |
| GROUP-03 | 8 | GROUP-04 | 8 |
| GROUP-05 | 8 | GROUP-06 | 8 |
| GROUP-07 | 8 | GROUP-08 | 8 |
| RECUR-01 | 9 | RECUR-02 | 9 |
| RECUR-03 | 9 | RECUR-04 | 9 |
| PWA-01 | 1 | PWA-02 | 1 |
| PWA-03 | 1 | PWA-04 | 1 |
| SHARE-01 | 10 | SHARE-02 | 10 |
| SHARE-03 | 2 | NOTIF-01 | 10 |
| NOTIF-02 | 10 | NOTIF-03 | 10 |
| NOTIF-04 | 10 | NOTIF-05 | 10 |

**Total:** 73 requirements mapped to 10 phases
**Unmapped:** 0

---
*Last updated: 2026-03-31*
