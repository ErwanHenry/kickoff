# Phase 7: Player Profiles - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (UI phase — discussion skipped per autonomous workflow)

<domain>
## Phase Boundary

Players can view detailed stats, match history, and comments from teammates. The profile displays matches played, attendance rate with color badge, overall rating (avg of 3 axes), radar chart of rating axes, last match date, match history (last 10 matches with results), and anonymous comments received. Guests see a CTA to create account after rating.

**Requirements covered:** PROFILE-01, PROFILE-02, PROFILE-03, PROFILE-04, PROFILE-05, PROFILE-06, PROFILE-07, PROFILE-08

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a UI/data-display phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

**Key Implementation Points:**
- Profile page at `/player/[id]` — Server Component for data fetching, OG metadata
- Stats overview: 4 cards in 2x2 grid (matches played, overall rating, attendance rate badge, last match date)
- Radar chart: Use Recharts RadarChart for 3-axis display (technique, physique, collectif)
- Match history: Last 10 matches with date, location, team, result (W/L/D), rating received
- Comments: Anonymous, chronological, last 10, text only (no rater names)
- Attendance badge: 🟢 ≥90% (text-green-600), 🟡 70-89% (text-yellow-600), 🔴 <70% (text-red-600)
- Mobile-first: max-w-2xl container, cards stacked vertically, responsive radar chart
- Guest CTA: Shown when user is not authenticated, button to /register

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 7 — Phase 7 goal, success criteria, and requirements (PROFILE-01 through PROFILE-08)
- `.planning/REQUIREMENTS.md` — Full requirements specification for player profiles
- `CLAUDE.md` — Project instructions, conventions, mobile-first principles

### Database Schema
- `src/db/schema.ts` — Complete database schema with player_stats table (matches_played, attendance_rate, avg_technique, avg_physique, avg_collectif, avg_overall, total_ratings_received, last_match_date)

### Prior Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Mobile-first patterns, colors
- `.planning/phases/06-ratings-stats/06-CONTEXT.md` — Rating system and stats calculation

### Existing Components
- `src/components/ui/` — shadcn/ui components available
- `src/lib/design-tokens.ts` — Design tokens including attendanceBadge, colors, statusBadges
- `src/lib/stats.ts` — Stats calculation utilities from Phase 6

### Libraries
- Recharts (RadarChart) — For 3-axis rating visualization

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components** — button, card, badge, avatar, sonner (toast), tabs, separator
- **Design system** — FootballIcon for domain concepts, mobile-first color palette, attendanceBadge function
- **Stats library** — Incremental average calculations, weighted overall formula
- **Auth system** — better-auth configured with session management

### Established Patterns
- **Mobile-first design** — All UI must work on iPhone SE (375px)
- **Server Components by default** — Use "use client" only for interactivity (charts, forms)
- **Toast notifications** — Sonner with top-center positioning
- **Database queries** — Drizzle ORM with PostgreSQL
- **Design tokens** — attendanceBadge(color) returns emoji, label, className

### Integration Points
- **Player stats** — Read from player_stats table calculated by Phase 6
- **Match history** — Join matches, match_players (for team/result), ratings (for received ratings)
- **Comments** — Read from ratings table where rated_id = player_id and comment is not null
- **Auth check** — Guest vs user flow for CTA display

</code_context>

<specifics>
## Specific Ideas

No specific requirements — UI phase with clear requirements from ROADMAP.

</specifics>

<deferred>
## Deferred Ideas

None — discussion skipped in auto mode.

</deferred>

---

*Phase: 07-player-profiles*
*Context gathered: 2026-03-31*
