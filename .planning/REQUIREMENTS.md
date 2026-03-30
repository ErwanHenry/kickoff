# Requirements: kickoff

**Defined:** 2026-03-29
**Core Value:** Zero-friction RSVP via shared link — guest flow (no account) is the primary entry point

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in with email/password
- [x] **AUTH-03**: User can request magic link login via email
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Guest can create account and merge all match history

### Match Management

- [ ] **MATCH-01**: Organizer can create match with date, time, location, max/min players
- [ ] **MATCH-02**: Organizer can set optional confirmation deadline
- [ ] **MATCH-03**: Organizer can set match recurrence (none / weekly)
- [ ] **MATCH-04**: Match generates unique shareable link (/m/{shareToken})
- [ ] **MATCH-05**: Match status progresses: draft → open → full → locked → played → rated
- [ ] **MATCH-06**: Match displays confirmed count vs max (e.g., "8/14 confirmés")
- [ ] **MATCH-07**: Organizer can view dashboard with upcoming and recent matches
- [ ] **MATCH-08**: Match can be associated with a group (optional)

### Guest RSVP Flow

- [ ] **GUEST-01**: Guest can view match page via shareable link without account
- [ ] **GUEST-02**: Guest can RSVP by entering first name only
- [ ] **GUEST-03**: Guest receives cookie/token for persistent identity (30 days)
- [ ] **GUEST-04**: Guest returning to match page sees their RSVP status
- [ ] **GUEST-05**: Guest can cancel their RSVP via same link
- [ ] **GUEST-06**: Guest automatically waitlisted when match is full
- [ ] **GUEST-07**: Guest waitlisted sees their position in queue

### Waitlist Management

- [ ] **WAIT-01**: When confirmed player cancels, first waitlisted player auto-promotes
- [ ] **WAIT-02**: Promoted player receives email notification
- [ ] **WAIT-03**: Match status changes from full → open when spot available
- [ ] **WAIT-04**: Match status returns to full when max players reached again

### Team Balancing

- [ ] **BALANCE-01**: System generates balanced teams using brute-force algorithm
- [ ] **BALANCE-02**: Algorithm uses player scores (technique 40%, physique 30%, collectif 30%)
- [ ] **BALANCE-03**: New players without ratings default to 3.0 on all axes
- [ ] **BALANCE-04**: Organizer can view team assignments with scores per team
- [ ] **BALANCE-05**: Organizer can manually reassign players between teams
- [ ] **BALANCE-06**: Match locks when teams are finalized
- [ ] **BALANCE-07**: Teams display with visual balance indicator (equilibré / léger avantage / déséquilibré)

### Post-Match

- [ ] **POST-01**: Organizer can mark player attendance (present / absent)
- [ ] **POST-02**: Organizer can enter final score (Team A - Team B)
- [ ] **POST-03**: Organizer can add match summary (optional text)
- [ ] **POST-04**: Match status changes to "played" when closed
- [ ] **POST-05**: Players marked absent receive "no_show" status

### Ratings

- [ ] **RATE-01**: Player can rate teammates on 3 axes (technique, physique, collectif) 1-5 stars
- [ ] **RATE-02**: Player can add optional comment (max 280 chars)
- [ ] **RATE-03**: Ratings are anonymous (rated player sees averages, not rater)
- [ ] **RATE-04**: Guest can rate matches they participated in (via guest token)
- [ ] **RATE-05**: User can rate matches they participated in (via session)
- [ ] **RATE-06**: Player cannot rate same teammate more than once per match
- [ ] **RATE-07**: Player stats recalculate incrementally after each rating
- [ ] **RATE-08**: Match status changes to "rated" when ≥50% of players rated

### Player Profiles

- [ ] **PROFILE-01**: Profile displays matches played count
- [ ] **PROFILE-02**: Profile displays attendance rate (with color badge: green ≥90%, yellow 70-89%, red <70%)
- [ ] **PROFILE-03**: Profile displays overall rating (avg of 3 axes)
- [ ] **PROFILE-04**: Profile displays radar chart of 3 rating axes
- [ ] **PROFILE-05**: Profile displays last match date (relative: "il y a 3 jours")
- [ ] **PROFILE-06**: Profile displays match history (last 10 matches with results)
- [ ] **PROFILE-07**: Profile displays anonymous comments received
- [ ] **PROFILE-08**: Guest sees CTA to create account after rating

### Groups

- [ ] **GROUP-01**: Organizer can create group with name and auto-generated slug
- [ ] **GROUP-02**: Group generates unique invite code
- [ ] **GROUP-03**: Organizer can invite players via link with invite code
- [ ] **GROUP-04**: User can join group via invite code
- [ ] **GROUP-05**: Group displays leaderboard (players ranked by avg_overall)
- [ ] **GROUP-06**: Leaderboard shows top 3 with 🥇🥈🥉 badges
- [ ] **GROUP-07**: Group displays match history
- [ ] **GROUP-08**: Group can have multiple organizers

### Recurrence

- [ ] **RECUR-01**: Weekly recurring match auto-creates next occurrence via cron
- [ ] **RECUR-02**: New occurrence inherits parent match settings (time, location, limits)
- [ ] **RECUR-03**: Group members receive email when new occurrence created
- [ ] **RECUR-04**: Players are NOT auto-confirmed (must RSVP each week)

### PWA

- [x] **PWA-01**: App is installable as PWA (manifest, service worker)
- [x] **PWA-02**: Service worker caches app shell for offline viewing
- [x] **PWA-03**: App displays install prompt on eligible devices
- [x] **PWA-04**: App works standalone after installation

### Sharing & Discovery

- [ ] **SHARE-01**: Match link generates OG preview for WhatsApp
- [ ] **SHARE-02**: OG image displays match info (title, date, location, confirmed count)
- [ ] **SHARE-03**: Match page loads in <1s on 3G connection

### Notifications

- [ ] **NOTIF-01**: Waitlisted player receives email when promoted to confirmed
- [ ] **NOTIF-02**: Player receives reminder email 2h before confirmation deadline
- [ ] **NOTIF-03**: Players receive email after match to rate teammates
- [ ] **NOTIF-04**: Group members receive email when new weekly match created
- [ ] **NOTIF-05**: New user receives welcome email after account creation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Payments

- **PAY-01**: Players can pay their share via Stripe/Lydia
- **PAY-02**: Organizer can track payment status per player
- **PAY-03**: Match can require payment for confirmation

### Venue Integration

- **VENUE-01**: Organizer can select venue from integrated directory
- **VENUE-02**: Match can auto-book venue via API
- **VENUE-03**: Venue availability displayed in real-time

### Advanced Stats

- **STAT-01**: System tracks goals and assists per player
- **STAT-02**: Profile displays goal/assist history
- **STAT-03**: Match displays live score updates

### Calendar Sync

- **CAL-01**: Users can export match to Google Calendar
- **CAL-02**: Match reminders sync to device calendar

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native iOS/Android apps | PWA avoids app store approval, instant updates, 50MB download |
| Real-time chat | WhatsApp already handles this perfectly |
| Payment collection | Phase 2 feature — adds Stripe/Lydia complexity |
| Venue booking | Phase 3 feature — requires partnerships (UrbanSoccer, Le Five) |
| Public marketplace | Private friend-group focus is the wedge |
| Advanced match stats | Goals/assists are overkill for casual play; peer ratings capture quality |
| Calendar sync | Nice-to-have, not essential for MVP |
| Multi-sport support | Dilutes focus; football-specific terminology matters |
| Video analysis | Storage/processing costs; peer ratings capture qualitative feedback |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 10 | Pending |
| MATCH-01 | Phase 2 | Pending |
| MATCH-02 | Phase 2 | Pending |
| MATCH-03 | Phase 9 | Pending |
| MATCH-04 | Phase 2 | Pending |
| MATCH-05 | Phase 2 | Pending |
| MATCH-06 | Phase 2 | Pending |
| MATCH-07 | Phase 3 | Pending |
| MATCH-08 | Phase 8 | Pending |
| GUEST-01 | Phase 2 | Pending |
| GUEST-02 | Phase 2 | Pending |
| GUEST-03 | Phase 2 | Pending |
| GUEST-04 | Phase 2 | Pending |
| GUEST-05 | Phase 2 | Pending |
| GUEST-06 | Phase 2 | Pending |
| GUEST-07 | Phase 2 | Pending |
| WAIT-01 | Phase 3 | Pending |
| WAIT-02 | Phase 10 | Pending |
| WAIT-03 | Phase 2 | Pending |
| WAIT-04 | Phase 2 | Pending |
| BALANCE-01 | Phase 4 | Pending |
| BALANCE-02 | Phase 4 | Pending |
| BALANCE-03 | Phase 4 | Pending |
| BALANCE-04 | Phase 4 | Pending |
| BALANCE-05 | Phase 4 | Pending |
| BALANCE-06 | Phase 4 | Pending |
| BALANCE-07 | Phase 4 | Pending |
| POST-01 | Phase 5 | Pending |
| POST-02 | Phase 5 | Pending |
| POST-03 | Phase 5 | Pending |
| POST-04 | Phase 5 | Pending |
| POST-05 | Phase 5 | Pending |
| RATE-01 | Phase 6 | Pending |
| RATE-02 | Phase 6 | Pending |
| RATE-03 | Phase 6 | Pending |
| RATE-04 | Phase 6 | Pending |
| RATE-05 | Phase 6 | Pending |
| RATE-06 | Phase 6 | Pending |
| RATE-07 | Phase 6 | Pending |
| RATE-08 | Phase 6 | Pending |
| PROFILE-01 | Phase 7 | Pending |
| PROFILE-02 | Phase 7 | Pending |
| PROFILE-03 | Phase 7 | Pending |
| PROFILE-04 | Phase 7 | Pending |
| PROFILE-05 | Phase 7 | Pending |
| PROFILE-06 | Phase 7 | Pending |
| PROFILE-07 | Phase 7 | Pending |
| PROFILE-08 | Phase 7 | Pending |
| GROUP-01 | Phase 8 | Pending |
| GROUP-02 | Phase 8 | Pending |
| GROUP-03 | Phase 8 | Pending |
| GROUP-04 | Phase 8 | Pending |
| GROUP-05 | Phase 8 | Pending |
| GROUP-06 | Phase 8 | Pending |
| GROUP-07 | Phase 8 | Pending |
| GROUP-08 | Phase 8 | Pending |
| RECUR-01 | Phase 9 | Pending |
| RECUR-02 | Phase 9 | Pending |
| RECUR-03 | Phase 9 | Pending |
| RECUR-04 | Phase 9 | Pending |
| PWA-01 | Phase 1 | Complete |
| PWA-02 | Phase 1 | Complete |
| PWA-03 | Phase 1 | Complete |
| PWA-04 | Phase 1 | Complete |
| SHARE-01 | Phase 10 | Pending |
| SHARE-02 | Phase 10 | Pending |
| SHARE-03 | Phase 2 | Pending |
| NOTIF-01 | Phase 10 | Pending |
| NOTIF-02 | Phase 10 | Pending |
| NOTIF-03 | Phase 10 | Pending |
| NOTIF-04 | Phase 10 | Pending |
| NOTIF-05 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 73 total
- Mapped to phases: 73
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-30 after roadmap creation*
