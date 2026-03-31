# Phase 4: Team Balancing - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discussion skipped per autonomous workflow)

<domain>
## Phase Boundary

Organizers can generate balanced teams for a match using the existing team balancing algorithm. The algorithm uses historical player ratings (technique 40%, physique 30%, collectif 30%) to create fair teams. Organizers can view team assignments with scores per team, manually reassign players between teams via drag-and-drop, and see a visual balance indicator. The match locks when teams are finalized.

**Requirements covered:** BALANCE-01, BALANCE-02, BALANCE-03, BALANCE-04, BALANCE-05, BALANCE-06, BALANCE-07

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

**Key Implementation Points:**
- Team balancing algorithm already exists in `src/lib/team-balancer.ts`
- Use @dnd-kit for drag-and-drop functionality (lightweight, accessible)
- Balance indicator thresholds: diff < 0.5 = "Équilibré ✓", 0.5-1.5 = "Léger avantage", > 1.5 = "Déséquilibré ⚠️"
- Team reveal UI should use the design system (FootballIcon, statusBadges, mobile-first)
- Match status transitions: open/full → locked (when teams finalized)
- Server Actions in lib/actions/ for team generation and locking

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 4 — Phase 4 goal, success criteria, and requirements (BALANCE-01 through BALANCE-07)
- `.planning/REQUIREMENTS.md` — Full requirements specification for team balancing
- `CLAUDE.md` — Project instructions, conventions, mobile-first principles

### Existing Implementation
- `src/lib/team-balancer.ts` — Complete team balancing algorithm (brute-force + serpentine)
- `src/db/schema.ts` — Database schema with matches, match_players tables; team enum (A, B), player_stats with rating columns

### Design System
- `src/lib/design-tokens.ts` — Design tokens including statusBadges, colors, shadows
- `src/components/icons/football-icons.tsx` — FootballIcon component for domain concepts

### Prior Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Auth patterns, mobile-first design
- `.planning/phases/02-match-creation-guest-rsvp/02-CONTEXT.md` — Match status flow, server actions patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Team balancing algorithm** — Complete implementation in `src/lib/team-balancer.ts` with brute-force (≤14 players) and serpentine (>14 players) methods
- **shadcn/ui components** — button, card, badge, avatar, sonner (toast), tabs, separator available
- **Design system** — FootballIcon for domain concepts, statusBadges for visual indicators, mobile-first color palette
- **Auth system** — better-auth configured with session management for protecting organizer-only routes

### Established Patterns
- **Mobile-first design** — All UI must work on iPhone SE (375px), color palette #2D5016 (vert terrain), #4ADE80 (accent)
- **Server Components by default** — Use "use client" only for interactivity (drag-and-drop, buttons)
- **Toast notifications** — Sonner with top-center positioning for user feedback
- **Server Actions in lib/actions/** — Next.js 16 requires Actions outside app/api/ directory
- **Design tokens** — Use statusBadges for consistent status indicators

### Integration Points
- **Match status transitions** — Need to update match.status from "open"/"full" to "locked" when teams are finalized
- **Team assignments** — Need to update match_players.team (A | B) for confirmed players
- **Player stats** — Algorithm reads from player_stats (avg_technique, avg_physique, avg_collectif) or defaults to 3.0
- **Navigation** — Team reveal page accessible from `/match/[id]/teams` route

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase with algorithm already implemented.

</specifics>

<deferred>
## Deferred Ideas

None — discussion skipped in auto mode.

</deferred>

---

*Phase: 04-team-balancing*
*Context gathered: 2026-03-31*
