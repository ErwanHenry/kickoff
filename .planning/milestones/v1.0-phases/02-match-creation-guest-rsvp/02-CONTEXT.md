# Phase 2: Match Creation & Guest RSVP - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the core CRUD for matches and the public RSVP flow — the primary differentiator. Organizers create matches with date, time, location, player limits, and deadline. The system generates a shareable link (/m/{shareToken}) that works on WhatsApp. Guests can view the match page and RSVP with just their first name (no account required). When full, guests go to waitlist and see their position.

</domain>

<decisions>
## Implementation Decisions

### Match Creation Form
- **D-01:** Card sections layout — Fields grouped in collapsible/expandable cards: "Quand ?", "Où ?", "Combien ?", "Options"
- **D-02:** Date/time picker — Native `<input type='datetime-local'>` for simplicity and mobile compatibility
- **D-03:** Location input — Autocomplete suggestions that suggests common venues as user types
- **D-04:** Player limits — Both max_players AND min_players as separate number inputs (not presets)
- **D-05:** Recurrence — Advanced picker with options for weekly, bi-weekly, and custom schedules
- **D-06:** Confirmation deadline — Required field with smart default (2h before match), user can override
- **D-07:** Group association — Optional autocomplete field; leave empty for standalone matches
- **D-08:** Draft + publish workflow — Match starts in "draft" state, creator clicks "Publier" to make it "open" and generate shareable link

### Public Match Page
- **D-09:** Top information — Essentials only: match title (or "Match du [date]"), date + time, location, player count
- **D-10:** Player count display — Full display: X/Y count + circular progress ring + status badge
- **D-11:** Confirmed players list — Show all confirmed players with names and avatars (scrollable if many)
- **D-12:** Waitlist display — Count only: "3 en liste d'attente" (no individual names shown publicly)
- **D-13:** Empty match state — Encouraging message: "Soyez le premier à confirmer !"
- **D-14:** Full match behavior — Hide RSVP button, show "Complet" badge, show waitlist count

### Guest RSVP Flow
- **D-15:** Name input — "Ton prénom ou surnom" (casual, matches user preference pattern from Phase 1)
- **D-16:** RSVP button behavior — State text progression: "Je suis là !" → "Confirmé ✓" → "Me désinscrire"
- **D-17:** Guest token storage — Both approaches: httpOnly cookie for auth/security + localStorage for UI state (name display, welcome message)
- **D-18:** Return visit experience — Personalized welcome banner: "Salut [Prénom] ! Tu es confirmé pour ce match"

### Match Status Flow
- **D-19:** Status badge visibility — Always visible colored badge on match cards: "Ouvert" (green), "Complet" (red), "Verrouillé" (gray)
- **D-20:** Status transitions — Claude's discretion — implement technically sound flow (likely: draft → open → full → locked → played → rated based on schema)

### Claude's Discretion
- Match status flow implementation — choose the most technically sound approach based on database schema and API design

### Deferred Ideas
- Calendar sync (CAL-01, CAL-02) — Noted as out of scope in REQUIREMENTS.md, belongs to v2/future phase

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 2 — Phase 2 goal, success criteria, and requirements (MATCH-01 through MATCH-07, GUEST-01 through GUEST-07, WAIT-03, WAIT-04, SHARE-03)
- `.planning/REQUIREMENTS.md` — Full requirements specification with acceptance criteria for match creation and guest RSVP
- `.planning/DESIGN_DOC.md` — Product rules and constraints (mobile-first, guest flow priority, merge behavior)

### Stack & Conventions
- `.planning/research/STACK.md` — Technology stack decisions (Next.js 15, Drizzle ORM, better-auth, shadcn/ui, Tailwind v4, PWA)
- `CLAUDE.md` — Project instructions, conventions, GSD phase tasks for Phase 2

### Database Schema
- `src/db/schema.ts` — Complete database schema with matches, match_players, users, groups tables; status enums and constraints

### Existing Components
- `src/components/ui/` — shadcn/ui components available: button, input, card, dialog, badge, avatar, dropdown-menu, toast (sonner), tabs
- `src/lib/auth.ts` — better-auth configuration for session management

### Phase 1 Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Prior decisions on mobile-first, colors, naming patterns, toast notifications, share_token format

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components** — button, input, card, dialog, badge, avatar, dropdown-menu, sonner (toast), tabs, separator
- **Auth system** — better-auth configured with email/password and magic link providers
- **Database schema** — Complete matches and match_players tables with all required status enums
- **PWA infrastructure** — Service worker and manifest already configured

### Established Patterns
- **Mobile-first design** — All UI must work on iPhone SE (375px), color palette #2D5016 (vert terrain), #4ADE80 (accent)
- **Server Components by default** — Use "use client" only for interactivity
- **Toast notifications** — Sonner with top-center positioning for user feedback
- **Flexible naming** — "Nom" field accepts first name, nickname, etc. (established in Phase 1)
- **Unique identifiers** — share_token uses nanoid(10), guest_token uses nanoid(10)

### Integration Points
- **Auth routes** — `/login`, `/register` already exist, middleware protects dashboard routes
- **Public routes** — `/m/[shareToken]` route must be accessible without authentication
- **API structure** — Server Actions or route handlers under `/api/`
- **Database connection** — Neon serverless via Drizzle ORM

</code_context>

<specifics>
## Specific Ideas

- **Card sections for match form** — Group fields in collapsible cards: "Quand ?" (date, time, deadline), "Où ?" (location), "Combien ?" (min/max players), "Options" (group, recurrence)
- **Autocomplete for location** — As user types "Urban", suggest "UrbanSoccer Nice", "UrbanSoccer Paris" from common venues list
- **Progress ring for player count** — Circular progress component showing X out of Y filled, green accent (#4ADE80)
- **Personalized welcome banner** — When guest returns, show "Salut [Prénom] ! Tu es confirmé pour ce match" in a prominent card at top of page
- **Draft + publish flow** — After creating match, show preview with "Publier" button that generates shareable link and changes status to "open"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-match-creation-guest-rsvp*
*Context gathered: 2026-03-30*
