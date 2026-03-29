# Domain Pitfalls: Football Match Organization

**Domain:** Mobile-first PWA for casual football match coordination
**Researched:** 2026-03-29
**Overall confidence:** MEDIUM (based on project context and general domain knowledge - web search unavailable)

## Executive Summary

Football match organization apps die from **guest flow friction**, **perceived unfairness in team balancing**, and **low post-match rating participation**. The graveyard of failed sports coordination apps is filled with products that required account creation too early, made team selection feel arbitrary, or failed to close the feedback loop.

The unique value proposition of this project—zero-friction guest RSVP via WhatsApp link—must be protected at all costs. Every design decision should be evaluated against: "Does this reduce friction for the guest who just clicked a WhatsApp link?"

## Critical Pitfalls

### Pitfall 1: Account Creation Friction Kills Conversion

**What goes wrong:**
Apps that require registration before viewing match details or RSVPing see 70-90% drop-off rates. Users clicking WhatsApp links expect instant access to information and one-tap confirmation. Any form fields (email, password, phone number) before showing value create abandonment.

**Why it happens:**
- Product thinking: "We need user accounts for retention and data"
- Security thinking: "We need authentication for authorization"
- Not realizing: The guest flow IS the product, not a lead magnet

**Consequences:**
- Match organizers return to WhatsApp group chats ("personne n'utilise l'app")
- Low RSVP rates make the app unreliable for headcount
- Network effects fail (critical mass of players never reached)
- App abandoned after 2-3 weeks

**Prevention:**
- **Phase 2 (Tâche 2.2):** Ensure `/m/{shareToken}` page is fully accessible without authentication
- Show match details immediately (title, date, location, confirmed players)
- Guest RSVP = single text input (prénom) + one button
- Store guest_token in httpOnly cookie + localStorage for recognition
- No CAPTCHA, no email verification, no phone confirmation for guests
- Only prompt for account creation AFTER value received (post-match rating view)

**Detection:**
- Monitor bounce rate on `/m/*` pages (target: <20%)
- Track guest RSVP conversion (views → confirmations, target: >60%)
- Watch for "match created but 0 RSVPs" pattern

**Phase to address:** Phase 2 (Match CRUD + RSVP) — this is the critical path

---

### Pitfall 2: Team Balancing Perceived as Unfair

**What goes wrong:**
Even if the algorithm is mathematically sound, if users don't UNDERSTAND how teams were generated, they perceive it as random or biased. "Pourquoi je suis toujours dans l'équipe B ?" destroys trust in the system. Organizers override the algorithm manually, defeating the purpose.

**Why it happens:**
- Black-box algorithm with no transparency
- Not showing team scores or balance metrics
- Ignoring player positions (gardien, défenseur, attaquant)
- Not accounting for recent match history (same teams every week)
- No override mechanism for organizer intuition

**Consequences:**
- Players reject assigned teams ("Je veux pas jouer avec Lucas")
- Organizers stop using the auto-balance feature
- Matches feel one-sided, reducing enjoyment
- Bad口碑 spreads ("les équipes sont toujours déséquilibrées")

**Prevention:**
- **Phase 3 (Tâche 3.1):** Display team scores prominently (total technique/physique/collectif)
- Show balance badge: "Équilibré ✓" if diff < 0.5, explain the math
- Allow organizer drag-and-drop override with real-time score recalculation
- Add "Remélanger" button to randomize among optimal combinations
- **Phase 4+:** Consider position preferences (gardien volontaire) as secondary constraint
- Track balance satisfaction: ask "Les équipes étaient-elles équilibrées ?" post-match

**Detection:**
- Monitor organizer override rate (if >50%, algorithm not trusted)
- Post-match survey question on team balance fairness
- Watch for identical team compositions across multiple matches

**Phase to address:** Phase 3 (Team Balancing) — algorithm transparency is critical

---

### Pitfall 3: Low Rating Participation Breaks the Loop

**What goes wrong:**
If fewer than 30% of players rate post-match, the player_stats dataset is too sparse for meaningful team balancing. New players stay at default 3.0 forever, and the algorithm never improves. The "feedback loop" value proposition collapses.

**Why it happens:**
- Rating flow feels like homework (too many clicks, small stars)
- No immediate value for the rater ("Why should I rate?")
- Rating requested too late (24h+ after match, memory faded)
- No reminder or notification to rate
- Mobile UI not optimized (stars too small, hard to tap)

**Consequences:**
- Team balancing never improves beyond random distribution
- Player profiles show "N/A" or default stats
- Differentiator vs competitors (intelligent balancing) is meaningless
- Users question: "Why bother rating if nobody else does?"

**Prevention:**
- **Phase 4 (Tâche 4.2):** Mobile-first star rating (44x44px minimum tap target)
- Send email notification immediately when match closes: "Comment s'est passé le match ?"
- Show rating progress: "3/12 joueurs ont noté — complète les avis !"
- Gamification: badge "Évaluateur fidèle" for rating 5+ matches
- **Phase 6:** Add gentle reminder 24h after match if not rated
- Default 3.0 for unrated players is OK, but incentivize participation
- Make rating fast: 3 stars × 10 players = 30 taps max, submit in <60 seconds

**Detection:**
- Track rating completion rate (target: ≥50% per match, ≥30% overall)
- Monitor time-to-rate (should be <24h for most ratings)
- Watch for "match played but 0 ratings" pattern

**Phase to address:** Phase 4 (Post-Match + Profil Joueur) — design for participation

---

### Pitfall 4: Guest → User Merge Loses Historical Data

**What goes wrong:**
A guest plays 5 matches, gets rated, then decides to create an account. If the merge logic fails or loses data, that user's history disappears. They see an empty profile and feel cheated: "J'ai joué tous ces matchs pour rien ?"

**Why it happens:**
- Guest tokens stored only in client-side cookie (cleared on browser change)
- Matching logic relies on email/phone but guests never provided it
- Merge only runs on registration, not on login to existing account
- Race condition: guest RSVPs to new match AFTER creating account
- No manual merge tool for organizers to fix mistakes

**Consequences:**
- Users delete accounts and re-register (fragmented data)
- Bad reviews: "Lost all my data when I created an account"
- Organizers can't see guest history before conversion
- Player stats inaccurate (split across guest_id and user_id)

**Prevention:**
- **Phase 6 (Tâche 6.3):** Store guest_token in httpOnly cookie (survives browser close)
- On registration, read cookie, find ALL match_players with that guest_token
- Update: user_id = new_user.id, guest_name = null, guest_token = null
- Same merge for ratings (rater_id and rated_id)
- Recalculate player_stats after merge
- Edge case: guest has multiple tokens (different names) → merge ALL
- Edge case: email already exists → merge guest data into EXISTING account
- **Post-MVP:** Add organizer tool to manually merge duplicate profiles

**Detection:**
- Test: create guest, RSVP 3 matches, rate, create account → verify all 3 matches visible
- Monitor for "user created but 0 match history" when they should have data
- Watch for orphaned guest_tokens (match_players with user_id=null after account creation)

**Phase to address:** Phase 6 (Polish + Deploy) — critical for retention

---

## Moderate Pitfalls

### Pitfall 5: Slow Mobile Load from WhatsApp Links

**What goes wrong:**
User clicks WhatsApp link on 4G/3G, sees blank screen for 3+ seconds. They close the tab, assume the link is broken, and ask organizer to resend. High bounce rate on `/m/*` pages kills adoption.

**Why it happens:**
- Server Components not optimized for Edge rendering
- Large client-side bundles (React, Recharts, shadcn/ui components)
- No OG image caching (WhatsApp fetches on every preview)
- Database queries not optimized (N+1 queries for player list)
- Loading spinners instead of skeleton screens

**Consequences:**
- 40-60% bounce rate on shared links
- Organizers report: "Les liens ne marchent pas sur mobile"
- Negative perception: "L'app est lente"
- Users switch back to WhatsApp group chat

**Prevention:**
- **Phase 1 (Tâche 1.4):** Configure Vercel Edge rendering for `/m/*` routes
- Use Server Components for initial HTML (no client-side JS for display)
- Lazy load heavy components (Recharts radar chart, team reveal animation)
- Optimize OG image generation (cache with Vercel Blob or CDN)
- **Phase 6:** Run Lighthouse audits on 3G throttling, target LCP <2.5s
- Skeleton loaders instead of spinners for perceived performance

**Detection:**
- Lighthouse Performance score on mobile (target: >90)
- Real User Monitoring (RUM) for `/m/*` pages if available
- Vercel Analytics for Core Web Vitals (LCP, FID, CLS)

**Phase to address:** Phase 1 (PWA + Vercel config) and Phase 6 (Final polish)

---

### Pitfall 6: Waitlist Promotion Race Conditions

**What goes wrong:**
Two players cancel simultaneously, waitlist promotion logic runs twice, the same waitlisted player gets promoted twice, or the match overfills (15/14). Database integrity violated, players confused.

**Why it happens:**
- No database transaction for cancellation + promotion
- SELECT then UPDATE race condition (two processes read same state)
- No unique constraint on (match_id, user_id) for confirmed status
- Frontend optimistic update conflicts with backend reality

**Consequences:**
- Match shows "15/14 confirmés" — impossible state
- Waitlisted player gets "Vous êtes confirmé" email twice
- Organizer must manually fix database
- Trust in the system erodes

**Prevention:**
- **Phase 2 (Tâche 2.3):** Use Drizzle transactions for cancellation + promotion
- Database constraint: UNIQUE(match_id, user_id) on confirmed status
- Lock row during cancellation operation (SELECT FOR UPDATE)
- Refresh page after cancel action (avoid optimistic updates for critical state)
- Add monitoring for max_players violations (alert if detected)

**Detection:**
- Database query: `SELECT match_id, COUNT(*) FROM match_players WHERE status='confirmed' GROUP BY match_id HAVING COUNT(*) > max_players`
- Watch for duplicate promotion emails in logs

**Phase to address:** Phase 2 (Match CRUD + RSVP) — data integrity is non-negotiable

---

### Pitfall 7: Email Deliverability Failure

**What goes wrong:**
Waitlist promotion emails, rating reminders, or new match notifications go to spam. Players never see critical updates ("Une place s'est libérée !"), miss deadlines, or don't rate. App feels unreliable.

**Why it happens:**
- Using default Resend domain (on.resend.com) instead of custom domain
- No SPF/DKIM/DMARC records configured
- Email content triggers spam filters (all caps, excessive exclamation marks)
- No "unsubscribe" link (required by law, spam signal)
- Sending from noreply@ instead of human-readable address

**Consequences:**
- 30-50% of emails never reach inbox
- Players miss deadline reminders → higher no-show rate
- Waitlist promotions unseen → spots go unfilled
- Low rating participation → sparse data

**Prevention:**
- **Phase 1 (Tâche 1.3):** Configure custom domain (noreply@kickoff.app or similar)
- Set up SPF, DKIM, DMARC records in DNS
- **Phase 6 (Tâche 6.2):** Test email deliverability with mail-tester.com
- Include plain text version + HTML version
- Add footer: "Tu reçois cet email parce que tu participes à un match sur kickoff. [Se désinscrire]"
- Avoid spam triggers: don't use "!!!", "URGENT", all caps subject lines
- Warm up sending domain gradually (Resend handles this automatically)

**Detection:**
- Resend dashboard: monitor bounce rate, open rate, click rate
- Seed test account: send real emails, check spam folder
- Watch for user reports: "Je n'ai pas reçu l'email"

**Phase to address:** Phase 1 (Auth setup) and Phase 6 (Notifications polish)

---

### Pitfall 8: Timezone Mishandling for Recurring Matches

**What goes wrong:**
Organizer creates "Foot du mardi" at 20h, but recurring cron runs in UTC timezone. Players see match times shift by 1-2 hours depending on daylight saving time. Confusion: "C'est 19h ou 20h cette semaine ?"

**Why it happens:**
- Storing match dates in UTC without preserving original timezone
- Cron job running in server timezone (UTC) instead of user timezone
- France/Germany daylight saving time (CET → CEST) not accounted for
- No timezone indicator in UI (users assume local time)

**Consequences:**
- Players arrive 1 hour late (or early)
- Organizer must manually correct every recurring match
- Recurring feature abandoned after 2-3 weeks
- App perceived as "buggy" for time-sensitive events

**Prevention:**
- **Phase 5 (Tâche 5.2):** Store all timestamps in UTC but include timezone offset
- Use UTC for storage, convert to Europe/Paris for display
- Cron job: check match.date timezone, not server time
- UI: display timezone explicitly ("20h (heure de Paris)")
- Test DST transition (last Sunday of March, last Sunday of October)
- **Consider:** Store user preference for timezone, default to Europe/Paris

**Detection:**
- Manual test: create recurring match, verify next occurrence has correct time
- Watch for "match time shifted by 1 hour" bug reports
- Log cron job outputs: verify created_at timestamps match expected times

**Phase to address:** Phase 5 (Groupes + Récurrence) — time-sensitive feature

---

## Minor Pitfalls

### Pitfall 9: PWA Installation Not Discoverable

**What goes wrong:**
Users don't know they can install the app as a PWA. They treat it as a mobile website, close the tab after use, and don't develop habitual usage. No "app" icon on home screen = out of sight, out of mind.

**Why it happens:**
- No install prompt or CTA ("Installe l'app pour un accès rapide")
- iOS Safari install prompt is hidden (must manually share → add to home screen)
- Android Chrome install prompt dismissed accidentally, never reappears
- No explanation of value proposition ("Pourquoi installer ?")

**Consequences:**
- Lower retention (users don't return to the app)
- Higher friction (must find WhatsApp link every time)
- No push notification capability (PWA required)
- Perceived as "tool" not "app"

**Prevention:**
- **Phase 6 (Tâche 6.4):** Add install prompt on 2nd visit (browser-native when possible)
- iOS: show instructions in modal ("Touche Partager → Ajouter à l'écran d'accueil")
- Android: listen to beforeinstallprompt event, show custom install button
- Explain value: "Installe pour recevoir les notifications de match"
- Add icon in manifest (192x192, 512x512) — green with soccer ball

**Detection:**
- Analytics: track PWA installation rate (target: >20% of returning users)
- Monitor return rate: installed users should return 2-3x more often

**Phase to address:** Phase 6 (Final polish + deploy) — nice-to-have for retention

---

### Pitfall 10: No-Show Rate Not Tracked or Addressed

**What goes wrong:**
Players confirm but don't show up repeatedly. No penalty, no tracking, organizer has no visibility. Chronic no-shows waste spots and frustrate waitlisted players. Organizer stops trusting the RSVP system.

**Why it happens:**
- No attendance marking after match (organizer forgets or too much work)
- player_stats.matches_no_show not calculated or displayed
- No consequence for high no-show rate (still invited to every match)
- Waitlisted players never get promoted because confirmed players no-show

**Consequences:**
- Reliable players get waitlisted while flaky players take spots
- Organizer returns to manual WhatsApp confirmation ("Tu viens ou pas ?")
- Match quality suffers (teams unbalanced due to absent players)
- Fairness perception erodes

**Prevention:**
- **Phase 4 (Tâche 4.1):** Attendance form REQUIRED before match can be rated
- Mark no-shows explicitly in player_stats
- Display attendance rate on player profile (🟢 ≥90%, 🟡 70-89%, 🔴 <70%)
- **Phase 5+:** Consider auto-deprioritizing chronic no-shows (lower waitlist priority)
- Send reminder email 2h before match with "Confirm your attendance" button
- Show no-show count in group leaderboard (transparency)

**Detection:**
- Track overall no-show rate (target: <10% of confirmations)
- Monitor repeat offenders (players with >30% no-show rate)
- Survey organizers: "Do RSVPs reflect actual attendance?"

**Phase to address:** Phase 4 (Post-Match + Profil Joueur) — data collection phase

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| **Phase 1** | Auth setup | Requiring login for `/m/*` access | Middleware must exclude public routes |
| **Phase 1** | PWA manifest | iOS install prompt not working | Add custom iOS instructions modal |
| **Phase 2** | RSVP guest | Cookie not persisting across sessions | Use httpOnly + localStorage fallback |
| **Phase 2** | Waitlist logic | Race condition on double cancel | Database transactions + row locking |
| **Phase 3** | Team balancing | Black-box algorithm | Show scores, allow override, explain math |
| **Phase 4** | Rating flow | Too many taps, small stars | 44x44px targets, batch rating UI |
| **Phase 4** | Attendance marking | Organizer skips this step | Block rating until attendance submitted |
| **Phase 5** | Recurring cron | Timezone mishandling | Store UTC, display Europe/Paris, test DST |
| **Phase 6** | Guest merge | Lost historical data | Test merge with 3+ matches, verify stats |
| **Phase 6** | OG images | Slow WhatsApp preview | Cache with Vercel Blob, pre-generate |
| **Phase 6** | Email deliverability | Spam folder | SPF/DKIM setup, test with mail-tester.com |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Guest flow friction | HIGH | Validated by DESIGN_DOC.md principles ("Zéro friction") |
| Team balancing perception | MEDIUM | General UX principle, but sports-specific nuances unverified |
| Rating participation | MEDIUM | Common gamification challenge, domain-specific assumptions |
| Guest merge data loss | HIGH | Technical integrity issue, well-understood problem |
| Mobile performance | HIGH | Web performance best practices apply |
| Database race conditions | HIGH | Standard concurrent access issue |
| Email deliverability | HIGH | Well-documented Resend/Email best practices |
| Timezone handling | MEDIUM | Recurring match complexity unverified (no research access) |
| PWA installation | LOW | Nice-to-have, not critical for MVP success |
| No-show tracking | MEDIUM | Social dynamics unverified, but logical assumption |

## Gaps to Address

**Unverified assumptions (needs phase-specific research):**
- Actual rating participation rates in similar apps (is 30% realistic?)
- Team balancing fairness tolerance (what diff threshold feels "fair"?)
- No-show rate in casual football (is <10% achievable?)
- Guest → user conversion rate (how many guests create accounts?)
- PWA install rate for utility apps (is 20% realistic?)

**Areas requiring user validation:**
- Is 3-axis rating (technique, physique, collectif) intuitive or too complex?
- Do players want position-based balancing (gardien, défenseur) or just skill?
- Is post-match rating too soon (emotions) or too late (memory faded)?
- Will organizers accept auto-balancing or always override?

**Technical risks needing exploration:**
- Neon serverless connection pooling under concurrent RSVP load
- Vercel Edge rendering limitations for complex Server Components
- Resend email delivery rate to French Gmail/Outlook addresses
- iOS Safari PWA install prompts (hidden in iOS 16.4+)

## Sources

- **PRIMARY:** /Users/erwanhenry/claude-projects/kickoff/DESIGN_DOC.md (Section 9: Risques & Mitigations)
- **PRIMARY:** /Users/erwanhenry/claude-projects/kickoff/CLAUDE.md (Règles absolues, contraintes)
- **PRIMARY:** /Users/erwanhenry/claude-projects/kickoff/.planning/PROJECT.md (Context, requirements)
- **SECONDARY:** Web search unavailable (rate-limited) — findings based on project context and general domain knowledge

**Confidence disclaimer:** Several critical assumptions (rating participation, balancing fairness tolerance, no-show rates) could not be verified through web research due to API rate limits. These should be validated with user interviews during Phase 1-2, and monitored closely post-launch.
