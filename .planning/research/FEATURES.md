# Feature Landscape

**Domain:** Football (soccer) match organization app
**Researched:** 2026-03-29
**Overall confidence:** MEDIUM (web tools rate-limited, analysis based on project docs + domain knowledge)

## Executive Summary

The football match organization app space is well-established with players like TeamSnap, TeamApp, Heja, and SportsEngine dominating team management. However, most solutions focus on **youth sports with complex scheduling** and **require account creation for all participants**.

**Kickoff's differentiating hypothesis:** Zero-friction guest RSVP via shareable link + intelligent team balancing based on peer ratings creates a wedge into casual friend-group football where existing tools feel heavy and corporate.

**Key insight:** The guest flow (no account required) is the primary entry point — if that doesn't work frictionlessly, nothing else matters. Most competitors miss this by requiring accounts for basic RSVP.

---

## Table Stakes

Features users expect in ANY team organization app. Missing these = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One-tap RSVP** | Users compare to WhatsApp group chats | Medium | Must work without account for guest flow |
| **Shareable match link** | Primary distribution channel (WhatsApp) | Low | OG preview critical for click-through |
| **Player list visibility** | "Who's coming?" is the #1 question asked | Low | Show confirmed vs waitlist clearly |
| **Match status tracking** | Open → Full → Locked → Played progression | Low | Standard state machine for events |
| **Cancellation flow** | People change plans, must handle gracefully | Medium | Automatic waitlist promotion expected |
| **Mobile-optimized UI** | 95% of interactions from phone on 3G/4G | High | If it breaks on iPhone SE, it's broken |
| **Instant load time** | Users bounce if >2s on first link | Medium | Server-side rendering critical for OG |
| **Basic match info** | Date, time, location are non-negotiable | Low | Should auto-detect timezone |
| **Organizer dashboard** | Creator needs overview of all matches | Medium | Recent matches + upcoming + quick actions |
| **Push/email notifications** | "Don't make me check the app manually" | High | Waitlist promotion, deadline reminders, post-match |
| **Persistent guest identity** | Returning guests shouldn't re-enter name | Medium | Cookie + localStorage fallback, 30-day expiry |

**Why these are table stakes:**
- TeamSnap, Heja, TeamApp all have these features
- Users who've used any team app expect this baseline
- Missing RSVP tracking = not a team organization app
- Poor mobile experience = immediate uninstall

---

## Differentiators

Features that set kickoff apart from competitors. Not required for MVP, but create competitive moat.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Guest-first RSVP flow** | No account required to respond to invitations | High | PRIMARY DIFFERENTIATOR — competitors require accounts |
| **Intelligent team balancing** | Algorithm uses peer ratings to create balanced teams | Medium | Brute-force optimal combinations for ≤20 players |
| **3-axis rating system** | Technique (40%), Physique (30%), Collectif (30%) | Medium | More nuanced than single "skill rating" |
| **Anonymous peer ratings** | Post-match feedback loop improves balancing over time | High | Incentive: better future matches = more fun |
| **Player profile with stats** | "Fiche scouting" — attendance rate, radar chart, history | Medium | Gamification + social proof for regulars |
| **Group leaderboards** | Friendly competition drives engagement | Low | 🥇🥈🥉 badges for top 3 players |
| **PWA (no app store)** | Installable instantly, no 50MB download | Medium | Service worker for offline, app shell caching |
| **Match recurrence automation** | Weekly matches auto-created via cron | Low | Reduces organizer burnout |
| **Merge guest → user** | Seamless transition from guest to account holder | High | Preserves all history (ratings, matches) |
| **French market focus** | Localized for French football culture (UrbanSoccer, Le Five) | Low | Built-in language support from day 1 |

**Why these differentiate:**
- **Guest flow:** TeamSnap, Heja, SportsEngine all require parent/player accounts. This is friction for casual pickup games.
- **Team balancing:** Most apps use manual assignment or random. Intelligent balancing based on historical data is unique.
- **Rating system:** Most apps track goals/assists (stats-heavy). Peer ratings on soft skills (technique, physique, collectif) capture "pickup game quality" better.
- **PWA over native:** Faster to market, no app store approval, instant updates.
- **Friend-group focus:** Most apps target youth sports (parents as organizers). Kickoff targets adult friend groups (players as organizers).

**Differentiation validation:**
- TeamSnap: Youth sports focus, heavy on scheduling/rosters, no team balancing
- Heja: Similar to TeamSnap, chat-focused, no intelligent balancing
- TeamApp: Customizable but complex, steep learning curve
- Pickup sports apps (Playo, SportsGratitude): Focus on finding games, not organizing private groups

---

## Anti-Features

Features to explicitly NOT build (or defer to Phase 3+).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Native iOS/Android apps** | App store approval (2-3 weeks), update lag, 50MB+ download | PWA with install prompt, service worker for offline |
| **Real-time chat** | WhatsApp already handles this perfectly | Share link in WhatsApp group, open in browser |
| **Payment collection** | Adds complexity (Stripe/Lydia integration), legal compliance | Phase 2 feature — let organizers handle offline for now |
| **Venue booking integration** | Requires partnerships (UrbanSoccer, Le Five), narrow market | Manual location input (free text) is sufficient for MVP |
| **Advanced match stats** | Goals, assists, heatmaps are overkill for casual play | 3-axis peer rating captures "quality" without stat overload |
| **Calendar sync (Google Cal)** | Nice-to-have, not essential for MVP | Link sharing + email reminders sufficient |
| **Public marketplace** | Finding random pickup games is different use case | Private friend-group focus is the wedge |
| **Video analysis** | Requires storage, processing, privacy concerns | Post-match ratings capture qualitative feedback |
| **Live score updates** | Not relevant for casual pickup games | Final score entered by organizer after match |
| **Multi-sport support** | Dilutes focus, football-specific terminology matters | "Foot du mardi" not "Weekly Game" |
| **Push notifications (native)** | PWA push has poor iOS support | Email notifications (Resend) work everywhere |

**Why these are anti-features:**
- **Scope creep:** Each adds weeks of development without validating core hypothesis
- **Competitor traps:** TeamSync, Sportlyo already do venue booking/payments — can't win there
- **Wrong problem:** Chat, payments, venue booking are solved problems (WhatsApp, Lydia, UrbanSoccer website)
- **Distraction from core:** The guest RSVP + team balancing loop is the innovation

**Exception criteria:**
- If ≥50% of users request payment collection in Phase 1 → consider Phase 2
- If venue partnerships emerge organically → revisit venue booking
- If chat is requested → double down on WhatsApp integration (share button, deep links)

---

## Feature Dependencies

```
Guest RSVP flow (2.2)
  ↓
Waitlist management (2.3)
  ↓
Team balancing algorithm (3.1)
  ↓
Team generation UI (3.2)
  ↓
Post-match ratings (4.2)
  ↓
Player stats calculation (4.2)
  ↓
Player profile (4.3)
  ↑
Group leaderboards (5.1)

Match creation (2.1) → Can be done in parallel with guest RSVP
Auth system (1.3) → Must come before dashboard, can run parallel to match creation
```

**Critical path:**
1. Guest RSVP is the funnel — if this breaks, nothing else matters
2. Team balancing depends on having player data (ratings) — cold start problem solved by default 3.0 rating
3. Ratings depend on matches being played — need to seed initial matches or accept cold start
4. Player profiles depend on ratings history — gamification hook for account creation

**Parallel development opportunities:**
- Auth system + Match creation (Phase 1)
- Team balancing UI + Post-match ratings (Phase 3-4)
- Groups + Leaderboards (Phase 5)

---

## MVP Feature Prioritization

**Must-have for Week 4 validation:**

1. ✅ **Guest RSVP flow** (Priority 1)
   - Shareable link `/m/{token}`
   - One-tap confirmation with name input
   - Cookie persistence for returning guests
   - Waitlist when full
   - Cancel/rejoin functionality

2. ✅ **Match creation** (Priority 1)
   - Date, time, location, player limits
   - Shareable link generation
   - Recurrence toggle (weekly)

3. ✅ **Team balancing** (Priority 2)
   - Brute-force algorithm for ≤20 players
   - Weighted scores (technique 40%, physique 30%, collectif 30%)
   - Default 3.0 rating for new players
   - Manual override for organizer

4. ✅ **Post-match ratings** (Priority 2)
   - 3-axis rating (1-5 stars)
   - Anonymous feedback
   - Optional comment (280 chars)
   - Guest + user flows

5. ✅ **Organizer dashboard** (Priority 3)
   - Upcoming match card
   - Recent matches list
   - Quick create button

**Defer to Phase 2:**

- 🔄 Player profiles with radar charts (too complex for Week 4)
- 🔄 Group leaderboards (nice-to-have, not essential)
- 🔄 Email notifications (manual WhatsApp reminders OK for MVP)
- 🔄 Match recurrence automation (manual creation OK for first 4 weeks)
- 🔄 Advanced stats (trend lines, match history, comments)

**Rationale:**
- Focus on the core loop: Create → RSVP → Balance → Play → Rate
- Guest flow is the acquisition channel — must be flawless
- Team balancing is the retention hook — must work well enough to show value
- Dashboard is organizer retention — nice UI but functional is enough

---

## Feature Complexity Assessment

| Feature | Technical Complexity | User Experience Complexity | Risk Level |
|---------|---------------------|---------------------------|------------|
| Guest RSVP + cookie persistence | Medium | Low | Medium (cookie tracking edge cases) |
| Waitlist auto-promotion | Low | Low | Low (standard queue logic) |
| Team balancing brute-force | Low (C(20,10) = 184K combos) | Low | Low (algorithm is well-defined) |
| Post-match ratings | Medium | Medium | Medium (anonymous UX, guest vs user) |
| Player stats calculation | Medium (incremental averages) | High (radar chart, trend lines) | Medium (data visualization) |
| Merge guest → user | High | Low | High (multiple guest_tokens, edge cases) |
| OG image generation | Medium (@vercel/og) | Low | Low (well-documented) |
| PWA manifest + service worker | Medium | Low | Medium (iOS Safari limitations) |
| Email notifications (Resend) | Low | Medium | Low (templates, cron jobs) |
| Match recurrence cron | Low | Low | Low (Vercel Cron documented) |

**Highest risk features:**
1. **Merge guest → user** — Edge cases around multiple identities, data migration
2. **Player stats visualization** — Radar charts on mobile, responsive design
3. **PWA on iOS** — Service worker limitations, add to home screen prompt

**Lowest risk features:**
1. **Match CRUD** — Standard REST API, well-understood
2. **Waitlist logic** — Queue operations, trivial
3. **Team balancing algorithm** — Brute-force is provably correct

---

## Competitive Feature Matrix

| Feature | Kickoff | TeamSnap | Heja | TeamApp | Sportlyo |
|---------|---------|----------|------|---------|----------|
| Guest RSVP (no account) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Team balancing algorithm | ✅ | ❌ | ❌ | ❌ | ❌ |
| Peer rating system | ✅ | ❌ | ❌ | ❌ | ❌ |
| PWA (no app store) | ✅ | ❌ (native) | ❌ (native) | ❌ (native) | ❌ (native) |
| Match scheduling | ✅ | ✅ | ✅ | ✅ | ✅ |
| RSVP tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| Email notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Group management | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat/messaging | ❌ (use WhatsApp) | ✅ | ✅ | ✅ | ✅ |
| Payment collection | ❌ (Phase 2) | ✅ | ❌ | ❌ | ✅ |
| Venue booking | ❌ (Phase 3) | ❌ | ❌ | ❌ | ✅ (France) |
| Player stats | ✅ (peer ratings) | ✅ (goals/assists) | ✅ | ✅ | ✅ |
| Multi-sport | ❌ (football only) | ✅ | ✅ | ✅ | ✅ |

**Key takeaways:**
- **Guest RSVP** is the blue ocean — no competitor allows this
- **Team balancing** is underserved — most apps use manual or random assignment
- **Chat/payments/venue** are red ocean — competitors already won, don't compete there
- **French market** is under-served — Sportlyo is closest but focuses on venue booking, not friend groups

---

## Sources

**Project Documentation (Primary):**
- DESIGN_DOC.md — Comprehensive feature specification, user flows, data model
- CLAUDE.md — Phase breakdown, technical stack, implementation details
- PROJECT.md — Project context, requirements, constraints

**Domain Knowledge:**
- TeamSnap, Heja, TeamApp, SportsEngine — General knowledge of team management app features (MEDIUM confidence)
- PWA best practices — Service worker patterns, mobile-first design (HIGH confidence)
- Team balancing algorithms — Brute-force combinatorics, rating systems (HIGH confidence)
- RSVP systems — Queue management, waitlist promotion logic (HIGH confidence)

**Competitor Analysis (Limited by rate limiting):**
- Web search tools rate-limited — unable to fetch current competitor features in real-time
- Analysis based on general domain knowledge + project documentation
- **CONFIDENCE: MEDIUM** — recommend validating with user interviews in Phase 1

**Gaps to Address:**
- Current competitor feature sets (verify TeamSnap/Heja still require accounts)
- French market specific apps (Sportlyo, UrbanSoccer integration patterns)
- PWA adoption rates for sports apps (iOS vs Android)
- Guest-to-user conversion benchmarks (industry standards)

---

## Next Steps for Roadmap

Based on this feature landscape:

1. **Phase 1 (Foundations):** Focus on guest RSVP flow — this is the acquisition channel and primary differentiator
2. **Phase 2 (Match CRUD):** Standard match creation + dashboard — table stakes, must be solid
3. **Phase 3 (Team Balancing):** Algorithm + UI — this is the retention hook, must feel magical
4. **Phase 4 (Post-Match):** Ratings + player stats — data collection for future balancing improvements
5. **Phase 5 (Groups):** Leaderboards + recurrence — organizer retention and engagement
6. **Phase 6 (Polish):** OG tags, email notifications, merge guest → user — production readiness

**Critical validation points:**
- Week 2: Guest RSVP works flawlessly on mobile (test with 5 friends)
- Week 3: Team balancing produces visibly fair teams (A/B test vs manual assignment)
- Week 4: Post-match ratings drive guest → user conversions (track conversion rate)

**Anti-patterns to avoid:**
- Don't build chat — WhatsApp is better, focus on integration (share button, deep links)
- Don't build payments — Lydia exists, let organizers handle offline
- Don't build venue booking — UrbanSoccer website works, manual input is fine
- Don't build native apps — PWA is faster to market, no app store friction

**Success metrics:**
- ≥50% RSVPs come via guest link (not account holders)
- ≥30% of players submit post-match ratings
- ≥60% of organizers create a second match after first one
- ≥1 guest converts to full user per match (on average)
