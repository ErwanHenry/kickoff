# Phase 6: Ratings & Stats - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discussion skipped per autonomous workflow)

<domain>
## Phase Boundary

Players can rate teammates on 3 axes (technique, physique, collectif) after a match is played. Ratings are anonymous (rated player sees averages, not rater). Both guests (via guest token) and authenticated users can rate matches they participated in. Player statistics are recalculated incrementally after each rating. The match status changes to "rated" when ≥50% of players have rated.

**Requirements covered:** RATE-01, RATE-02, RATE-03, RATE-04, RATE-05, RATE-06, RATE-07, RATE-08

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a UI/infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

**Key Implementation Points:**
- Rating inputs: Star icons (1-5) for each axis (technique, physique, collectif)
- Comment field: Textarea with 280 char limit, optional
- Database: ratings table stores per-match per-rater-per-rated triplets
- Stats recalculation: Incremental average update after each rating
- Guest support: Read guest token from cookie, match via guest_token field
- Deduplication: UNIQUE constraint on (match_id, rater_id, rated_id)
- 50% threshold: Count distinct raters when updating match status to "rated"

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 6 — Phase 6 goal, success criteria, and requirements (RATE-01 through RATE-08)
- `.planning/REQUIREMENTS.md` — Full requirements specification for ratings and stats
- `CLAUDE.md` — Project instructions, conventions, mobile-first principles

### Database Schema
- `src/db/schema.ts` — Complete database schema with ratings table (match_id, rater_id, rated_id, technique, physique, collectif, comment, created_at), player_stats table with avg fields and total_ratings_received

### Prior Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Mobile-first patterns, colors
- `.planning/phases/02-match-creation-guest-rsvp/02-CONTEXT.md` — Guest token handling
- `.planning/phases/05-post-match-closure/05-CONTEXT.md` — Match status flow to "played"

### Existing Components
- `src/components/ui/` — shadcn/ui components available
- `src/lib/design-tokens.ts` — Design tokens including colors, statusBadges

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components** — button, input, card, badge, avatar, sonner (toast), textarea, tabs
- **Design system** — FootballIcon for domain concepts, mobile-first color palette
- **Auth system** — better-auth configured with session management
- **Database schema** — Ratings and player_stats tables already defined

### Established Patterns
- **Mobile-first design** — All UI must work on iPhone SE (375px)
- **Server Components by default** — Use "use client" only for interactivity (star ratings, forms)
- **Toast notifications** — Sonner with top-center positioning
- **Server Actions in lib/actions/** — Next.js 16 requires Actions outside app/api/ directory
- **Guest tokens** — httpOnly cookies with 30-day expiry for guest identification

### Integration Points
- **Match status** — Match must be "played" before rating (Phase 5 sets this)
- **Player stats** — Ratings update player_stats table incrementally
- **Guest flow** — Rating page accessible via /m/{shareToken}/rate for guests
- **User flow** — Rating page accessible via /match/{id}/rate for authenticated users

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase with clear requirements from ROADMAP.

</specifics>

<deferred>
## Deferred Ideas

None — discussion skipped in auto mode.

</deferred>

---

*Phase: 06-ratings-stats*
*Context gathered: 2026-03-31*
