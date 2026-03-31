# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 01-foundation
**Areas discussed:** Auth UX, Landing page, PWA behavior

---

## Auth UX

### Login/Register Flow Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single page with tabs (Recommended) | One page at /login with tabs: 'Connexion' / 'Inscription'. Less navigation, simpler for mobile. | ✓ |
| Separate pages | /login and /register as distinct routes. More traditional, clear URL intent. | |

**User's choice:** Single page with tabs

---

### Primary Login Method

| Option | Description | Selected |
|--------|-------------|----------|
| Email/password first (Recommended) | Traditional flow, familiar to most users. Magic link as secondary option. | ✓ |
| Magic link first | Magic link is the default, email/password as fallback. Lower friction but requires email access. | |

**User's choice:** Email/password first

---

### Magic Link Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below password field (Recommended) | A subtle link 'Connexion sans mot de passe' under the password input. | ✓ |
| As a separate tab/mode | Third tab alongside Login/Register. More prominent but adds UI complexity. | |
| On a separate page | Link from login page to /magic-link. Clean separation but more navigation. | |

**User's choice:** Below password field

---

### Post-Auth Redirect

| Option | Description | Selected |
|--------|-------------|----------|
| /dashboard (Recommended) | Central hub for organizers. Shows their matches and groups. | ✓ |
| /matches/new | Go straight to 'create a match'. | |
| You decide | Claude picks the standard approach. | |

**User's choice:** User wanted to discuss user types first. After clarification, agreed to /dashboard as Phase 1 default with refined routing in Phase 2+.

---

### Form Validation Errors

| Option | Description | Selected |
|--------|-------------|----------|
| Inline per field (Recommended) | Error message appears below the specific field. | |
| Toast notification | Single toast summarizing all errors. | |
| Both | Inline errors + summary toast for visibility. | ✓ |

**User's choice:** Both

---

### Remember Me

| Option | Description | Selected |
|--------|-------------|----------|
| Yes - 30 days (Recommended) | Checkbox extends session from 7 to 30 days. | ✓ |
| No checkbox - always 30 days | Sessions always last 30 days. | |
| No - default session only | Use better-auth defaults (7 days). | |

**User's choice:** Yes - 30 days

---

### Name Field

| Option | Description | Selected |
|--------|-------------|----------|
| First name only (Recommended) | 'Prénom' - matches guest RSVP flow. | |
| Full name (single field) | 'Nom complet' - one text field. | |
| First + Last name (two fields) | Separate fields. | |

**User's choice:** User clarified: "Can be first name, first + last or even pseudo" — wants flexibility.

**Follow-up:** Single flexible "Nom" field — accepts whatever the user wants to be called.

---

## Landing Page

### Hero Focus

| Option | Description | Selected |
|--------|-------------|----------|
| Problem + solution headline (Recommended) | Bold text: 'Fini le bordel sur WhatsApp. Crée ton match, partage le lien.' | ✓ |
| Visual-first with illustration | Large illustration/screenshot, headline secondary. | |
| Minimal with just CTA | Logo + button only. | |

**User's choice:** Problem + solution headline

---

### Page Sections

| Option | Description | Selected |
|--------|-------------|----------|
| Single-screen minimal (Recommended) | Hero + CTA only. No scrolling needed. | |
| Hero + 3 feature icons | Hero, then simple row with 3 icons: Inviter, Équilibrer, Noter. | ✓ |
| Full marketing page | Hero + features + how it works + social proof. | |

**User's choice:** Hero + 3 feature icons

---

### CTA Text

| Option | Description | Selected |
|--------|-------------|----------|
| Créer un match (Recommended) | Direct action for organizers. | |
| Commencer | More generic. | |
| C'est parti ! | Casual/fun tone. | ✓ |

**User's choice:** C'est parti !

---

### CTA Target

| Option | Description | Selected |
|--------|-------------|----------|
| /login (Recommended) | User must log in before creating. | ✓ |
| /matches/new with auth gate | Goes to form, redirects if not authenticated. | |
| You decide | Claude picks. | |

**User's choice:** User wanted to discuss user types first. This led to a detailed discussion about Captain/Manager/Player roles. Final decision: /login for Phase 1.

---

## User Roles (Extended Discussion)

User provided detailed role system:

**Captain:**
- Group creator (coach-like)
- Hire/fire managers (1-2 per group)
- Delete any match
- Approve player invitations
- Decide team composition (who starts, format: 5v5/7v7/11v11)

**Manager:**
- Invited by Captain
- Same permissions as Captain

**Player:**
- Create matches (own deletable by Captain)
- Rate other players (not self, not game)
- Propose inviting new players (needs approval)

**Democratic Override:**
- >50% of players can trigger Captain election

**Participation:**
- Everyone (Captain, Manager, Player) can join/cancel from games

**Notes:** This refines the original DESIGN_DOC.md role enum from `organizer | player` to `captain | manager | player`. Full implementation in Phase 8.

---

## PWA Behavior

### Install Prompt Timing

| Option | Description | Selected |
|--------|-------------|----------|
| After first RSVP (Recommended) | User has taken action, engaged. | |
| After login/register | User has committed to account. | ✓ |
| Never prompt | Browser default only. | |

**User's choice:** After login/register

---

### Offline Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Show cached pages + offline banner (Recommended) | Cached version with 'Hors ligne' banner. Actions disabled. | ✓ |
| Full offline page | Replace with dedicated offline page. | |
| You decide | Claude picks standard approach. | |

**User's choice:** Cached pages + offline banner

---

### Splash Screen

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + green background (Recommended) | 'kickoff' on #2D5016 background. | ✓ |
| Logo + tagline | Logo with short tagline. | |
| You decide | Claude picks based on best practices. | |

**User's choice:** Logo + green background

---

### Display Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone (Recommended) | Full-screen, no browser chrome. | ✓ |
| Minimal-ui | Small browser controls remain. | |
| Browser tab | Opens as normal tab. | |

**User's choice:** Standalone

---

### App Icon

| Option | Description | Selected |
|--------|-------------|----------|
| Football/soccer ball on green (Recommended) | Football icon on #2D5016 background. | ✓ |
| Letter 'K' stylized | 'K' for kickoff with football elements. | |
| Whistle icon | Referee whistle. | |
| You decide | Claude creates placeholder. | |

**User's choice:** Football/soccer ball on green

---

### Push Notifications

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to Phase 10 (Recommended) | Keep Phase 1 simple, email notifications later. | ✓ |
| Basic setup now | Set up SW for push capability now. | |
| You decide | Claude picks based on MVP priorities. | |

**User's choice:** Defer to Phase 10

---

## Claude's Discretion

- Error message copy and tone
- Exact spacing/layout
- Animation/transition details
- Service worker caching strategy details

## Deferred Ideas

- User type-specific routing (Phase 2+)
- Full role permissions implementation (Phase 8)
- Democratic Captain vote mechanism (Future/v2)
