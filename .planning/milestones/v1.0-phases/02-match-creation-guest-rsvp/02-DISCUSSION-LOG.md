# Phase 2: Match Creation & Guest RSVP - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 2-Match Creation & Guest RSVP
**Areas discussed:** Match creation form, Public match page, Guest RSVP flow, Match status flow

---

## Match Creation Form

### Form Layout on Mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Single long form | Single vertical stack with 'Créer le match' CTA at bottom. Works best on mobile with virtual keyboard. | |
| Step wizard | Split into 'Basics' (date, lieu) + 'Options' (limites, deadline). Less scrolling, more structured. | |
| Card sections | Fields grouped in cards: 'Quand ?', 'Où ?', 'Combien ?'. Each card can be collapsed/expanded. | ✓ |

**User's choice:** Card sections

---

### Date/Time Picker

| Option | Description | Selected |
|--------|-------------|----------|
| Native picker | Use native `<input type='datetime-local'>`. Simple, works on all phones, no external libraries. | ✓ |
| Date + Time separate | Use two separate inputs: `<input type='date'>` + `<input type='time'>`. More explicit, some users prefer this. | |
| Custom library | Use a custom React component library. More control, but adds dependency and bundle size. | |

**User's choice:** Native picker

---

### Location Input

| Option | Description | Selected |
|--------|-------------|----------|
| Free text | Simple text input with placeholder 'Ex: UrbanSoccer Nice'. User types freely, no validation. | |
| Autocomplete suggestions | Autocomplete with common venues. Text input that suggests from a list as you type. | ✓ |
| Predefined list | Dropdown list of predefined venues. User selects from list only. | |

**User's choice:** Autocomplete suggestions

**User's note:** Common venues could be stored in a static list or fetched from a database. Suggest UrbanSoccer, Sporti, etc.

---

### Player Limits Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Max only | Just max_players (default 14). min_players is always 10 implicitly. Simpler. | |
| Max + Min | Both max_players AND min_players (number inputs). More explicit, but more fields. | ✓ |
| Presets | Preset buttons: '7v7 (14)', '5v5 (10)', '11v11 (22)' plus custom option. Quick selection. | |

**User's choice:** Max + Min

---

### Recurrence Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Simple toggle | Toggle switch or checkbox: 'Match hebdomadaire'. Simple on/off for now. | |
| Radio buttons | Radio buttons: 'Une fois' / 'Chaque semaine'. More explicit, clearer state. | |
| Advanced picker | Full recurrence picker: weekly, bi-weekly, custom schedule. More powerful now. | ✓ |

**User's choice:** Advanced picker

---

### Confirmation Deadline Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Optional field | Optional datetime field. If empty, no deadline (users can RSVP until match is full). | |
| Auto 2h before | Auto-calculated: 2 hours before match time. User sees it but can't change. | |
| Required with default | Required field with smart default (2h before match), user can override. | ✓ |

**User's choice:** Required with default

---

### Group Association

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown | Select dropdown showing user's groups. 'Aucun groupe' option exists for standalone matches. | |
| Optional autocomplete | Optional field — leave empty for standalone match. Typeahead search if user has many groups. | ✓ |
| Skip for now | No group association in Phase 2. Matches are standalone. Groups come in Phase 8. | |

**User's choice:** Optional autocomplete

---

### Match Initial State

| Option | Description | Selected |
|--------|-------------|----------|
| Draft + publish | Match starts in 'draft', creator clicks 'Publier' to make it 'open' and generate shareable link. Two-step process. | ✓ |
| Immediately open | Match is immediately 'open' and shareable upon creation. One-step process, faster. | |
| Auto on first RSVP | Match is always 'draft' until first player RSVPs, then becomes 'open'. Automatic transition. | |

**User's choice:** Draft + publish

---

## Public Match Page

### Top Information Display

| Option | Description | Selected |
|--------|-------------|----------|
| Essentials only | Match title (or 'Match du [date]'), date + time, location, player count (8/14). Simple, focused. | ✓ |
| Essentials + extras | Essentials + group name, deadline countdown, creator name. More context, more clutter. | |
| Full details | Everything: title, date, time, location, group, deadline, creator, recurrence, player list preview. | |

**User's choice:** Essentials only

---

### Player Count Display

| Option | Description | Selected |
|--------|-------------|----------|
| Text only | Text: '8 joueurs confirmés sur 14'. Simple, but less visual. | |
| Progress ring | Circular progress or ring showing 8/14 filled. Visual, quick to understand. | ✓ |
| Progress bar | Horizontal bar: '████────' 8/14. Linear representation of fill status. | |

**User's choice:** Progress ring

---

### Confirmed Players List Display

| Option | Description | Selected |
|--------|-------------|----------|
| Show all confirmed | Show all confirmed players with names and avatars. Scrollable if many. Transparent and social proof. | ✓ |
| Show limited | Show first 5 confirmed + '... et X autres'. Compact, less scrolling. | |
| Hide names | Don't show player names publicly. Just show count. Privacy-first. | |

**User's choice:** Show all confirmed

---

### Waitlisted Players Display

| Option | Description | Selected |
|--------|-------------|----------|
| Show waitlisted | Show waitlist section below confirmed players with names and queue position. | |
| Count only | Show waitlist count only ('3 en liste d'attente'). Less detail. | ✓ |
| Hidden | Don't show waitlist publicly. Only the user sees their own status if waitlisted. | |

**User's choice:** Count only

---

### Empty Match State

| Option | Description | Selected |
|--------|-------------|----------|
| Encouraging message | Show '0/X joueurs' with empty state message: 'Soyez le premier à confirmer !'. Encouraging. | ✓ |
| Minimal empty state | Show empty list with placeholder icons. Minimal, honest state. | |
| Hide until active | Don't show match page at all until first RSVP. Redirect to 'Match pas encore disponible'. | |

**User's choice:** Encouraging message

---

### Full Match Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hide RSVP, show waitlist | Show 'Complet' badge, hide RSVP button, show waitlist count '3 en attente'. Clear full state. | ✓ |
| Button becomes waitlist | Keep RSVP button active, it says 'Rejoindre la liste d'attente'. More discoverable. | |
| Full info | Both: waitlist button + 'Complet' badge + waitlist count. Maximum clarity. | |

**User's choice:** Hide RSVP, show waitlist

---

### Progress Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Count only | Show X/Y count: '8/14 joueurs'. Simple, effective. | |
| Count + ring | Show count + ring: '8/14' with circular progress. Visual fill status. | |
| Full display | Show count + ring + badge: '8/14' with progress ring and status badge. Maximum information. | ✓ |

**User's choice:** Full display

---

## Guest RSVP Flow

### Guest Name Input Field

| Option | Description | Selected |
|--------|-------------|----------|
| First name only | Single text input 'Ton prénom' with big 'Je suis là !' button. Minimal friction. | |
| Full name | Full name input 'Ton nom'. More formal, but guests might enter just first name anyway. | |
| Name or nickname | First name + nickname hint: 'Ton prénom ou surnom'. Casual, matches user preference. | ✓ |

**User's choice:** Name or nickname

---

### RSVP Button Behavior After Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| State text | Text changes: 'Je suis là !' → 'Confirmé ✓' → 'Me désinscrire'. Clear state progression. | ✓ |
| Button style | Full button transformation: Green primary → Outline secondary → Red danger. Visual state change. | |
| Separate cancel | Show cancel separately: 'Je suis là !' becomes disabled, 'Annuler' button appears below. | |

**User's choice:** State text

---

### Guest Token Storage

| Option | Description | Selected |
|--------|-------------|----------|
| httpOnly cookie | httpOnly cookie (secure, httpOnly). Can't be read by JS, more secure from XSS. | |
| localStorage + cookie | localStorage + fallback to cookie. Accessible by JS for better UX, but less secure. | |
| Both approaches | Both: httpOnly cookie for auth, localStorage for UI state (name display). Best of both. | ✓ |

**User's choice:** Both approaches

---

### Return Visit Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Personalized welcome | Show personalized banner: 'Salut [Prénom] ! Tu es confirmé pour ce match'. Warm, social proof. | ✓ |
| Status badge | Show status badge only: 'Tu es confirmé'. Subtle, privacy-conscious. | |
| Minimal change | Show nothing different — just the RSVP button in confirmed state. Minimal. | |

**User's choice:** Personalized welcome

---

## Match Status Flow

### Match Status Flow Definition

| Option | Description | Selected |
|--------|-------------|----------|
| All states explicit | draft → open → full → locked → played → rated. Each state is explicit. | |
| Simplified states | draft → open/full → played → rated. Skip 'locked', merge open/full. Simplified. | |
| Claude's discretion | You decide based on implementation needs. Flexibility for technical best practices. | ✓ |

**User's choice:** Claude's discretion

---

### Status Badge Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible badge | Show colored badge on match card: 'Ouvert' (green), 'Complet' (red), 'Verrouillé' (gray). Visual clarity. | ✓ |
| Contextual badge | Show status only when relevant: 'Complet' badge when full, otherwise no badge. Cleaner. | |
| No badges yet | Don't show status badges in Phase 2. Keep UI minimal, focus on player count. | |

**User's choice:** Always visible badge

---

## Claude's Discretion

Areas where user deferred to Claude's judgment:
- Match status flow implementation (draft → open → full → locked → played → rated transitions)

## Deferred Ideas

- **Calendar sync** — User asked about calendar integration; noted as out of scope per REQUIREMENTS.md (CAL-01, CAL-02 are v2 requirements)

---
*Session logged: 2026-03-30*
