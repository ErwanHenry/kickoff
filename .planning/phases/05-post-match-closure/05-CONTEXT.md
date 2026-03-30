# Phase 5: Post-Match Closure - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

After a match is played, the organizer closes it by marking which confirmed players actually attended (those who didn't show receive "no_show" status) and entering the final score. An optional match summary can be added. The match status changes to "played" when closed, preparing it for the player ratings phase.

</domain>

<decisions>
## Implementation Decisions

### Attendance Marking UI
- **D-01:** Toggle list layout — List of all confirmed players with toggle switches (checkbox/switch) for "Present" vs "Absent". Simple, familiar pattern that works well on mobile.
- **D-02:** Default state — All confirmed players are marked "Present" by default. Organizer only changes the ones who didn't show.
- **D-03:** Visual feedback — Use shadcn/ui switch/checkbox component. Clear visual distinction between present (green check) and absent (red x or grayed out).

### Score Input Format
- **D-04:** Number inputs — Two native HTML5 number inputs side by side: "Équipe A [__] - [__] Équipe B". Simple, standard approach with keyboard support.
- **D-05:** Input constraints — Min value 0, max value 99 (no football match goes beyond 99). Step of 1.
- **D-06:** Default value — 0-0 (both inputs start at 0).

### Summary & Field Requirements
- **D-07:** Score required — Both team score fields are required for submission. Block "Clôturer le match" button until both have values ≥ 0.
- **D-08:** Attendance marking required — All confirmed players must be explicitly marked present or absent before closing.
- **D-09:** Match summary optional — Plain textarea field (not rich text), max 500 characters, placeholder "Moments forts, MVP, remarques..."
- **D-10:** Summary placement — Below score inputs and attendance list, before the submit button.

### Timing & Permissions
- **D-11:** Close anytime — Organizer can close a match at any time, regardless of match date or lock status. This allows flexibility for rescheduled/cancelled matches.
- **D-12:** Who can close — Only the match creator (organizer) can close the match. No permission delegation in this phase.

### UX Flow
- **D-13:** Page access — Close match via `/match/[id]/attendance` route. Also accessible from dashboard and match detail page via "Clôturer le match" button.
- **D-14:** Confirmation — Show confirmation dialog before closing: "Tu vas clôturer ce match. Les joueurs absents recevront le statut 'no_show'. Continuer ?"
- **D-15:** Post-close redirect — After closing, redirect to match detail page with toast "Match clôturé ! Les joueurs peuvent maintenant noter leurs coéquipiers."

### Mobile-Specific
- **D-16:** Touch targets — Toggle switches are at least 44x44px for reliable touch input.
- **D-17:** Single column layout — On mobile, stack everything vertically: score inputs → attendance list → summary → button.
- **D-18:** Sticky submit button — "Clôturer le match" button sticks to bottom of viewport on mobile for easy access.

### Claude's Discretion
- Exact spacing and visual hierarchy within the form
- Loading state during submission (spinner vs button text change)
- Whether to show a preview of the match summary before closing
- Error message copy and tone for validation failures

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 5 — Phase 5 goal, success criteria, and requirements (POST-01 through POST-05)
- `.planning/REQUIREMENTS.md` — Full requirements specification for post-match closure

### Stack & Conventions
- `.planning/research/STACK.md` — Technology stack decisions (Next.js 15, Drizzle ORM, better-auth, shadcn/ui, Tailwind v4)
- `CLAUDE.md` — Project instructions, conventions, and mobile-first principles

### Database Schema
- `src/db/schema.ts` — Complete database schema with matches, match_players tables; status enums including "played" and "no_show"

### Existing Components
- `src/components/ui/` — shadcn/ui components: button, input, card, checkbox, badge, sonner (toast), textarea (if exists, otherwise add)
- `src/lib/validations/match.ts` — Existing Zod validation schemas for matches (may need extension for score/attendance)

### Phase 1 & 2 Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Mobile-first patterns, colors, toast positioning, naming conventions
- `.planning/phases/02-match-creation-guest-rsvp/02-CONTEXT.md` — Match status flow, server actions patterns, dashboard navigation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components** — button, input, card, checkbox, badge, sonner (toast), tabs, separator available
- **Auth system** — better-auth configured with session management for protecting organizer-only routes
- **Database schema** — Matches and match_players tables with all required status enums (including "played" and "no_show")
- **Server Actions pattern** — `src/lib/api/matches/actions.ts` has existing match actions pattern to follow

### Established Patterns
- **Mobile-first design** — All UI must work on iPhone SE (375px), color palette #2D5016 (vert terrain), #4ADE80 (accent)
- **Server Components by default** — Use "use client" only for interactivity (toggles, form submission)
- **Toast notifications** — Sonner with top-center positioning for user feedback
- **Server Actions in lib/actions/** — Next.js 16 requires Actions outside app/api/ directory

### Integration Points
- **Match status transitions** — Need to update match.status from "locked" (or other) to "played"
- **No-show handling** — Need to update match_players.attended and match_players.status for absent players
- **Navigation** — Link from `/match/[id]` detail page and from `/dashboard` upcoming matches card
- **Post-close flow** — This phase sets up Phase 6 (Ratings & Stats) — match must be "played" before players can rate

</code_context>

<specifics>
## Specific Ideas

- **Toggle list with avatars** — Each player row shows avatar (initials), name, and a toggle switch. Present = green check icon, Absent = gray with strikethrough name.
- **Score section as card** — Score inputs in a highlighted card at top: big bold numbers, "Équipe A - Équipe B" label above.
- **Progress indicator** — Show "X/Y joueurs marqués" attendance progress as organizer marks each player.
- **Quick-mark-all button** — "Tous présents" button to quickly mark all confirmed players as present (useful when everyone showed up).
- **No-show visual warning** — When marking a player absent, show a subtle warning: "Ce joueur recevra le statut 'no_show'"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-post-match-closure*
*Context gathered: 2026-03-30*
