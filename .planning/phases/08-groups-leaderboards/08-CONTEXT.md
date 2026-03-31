# Phase 8: Groups & Leaderboards - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discussion skipped per autonomous workflow)

<domain>
## Phase Boundary

Organizers can create groups with invite codes, and players can view leaderboards ranked by skill. Groups have multiple organizers (captain/manager roles). Leaderboards display players ranked by avg_overall with top 3 medals (🥇🥈🥉). Groups can be associated with matches for recurring play. Players join groups via invite codes or invitation links.

**Requirements covered:** GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05, GROUP-06, GROUP-07, GROUP-08, MATCH-08

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is an infrastructure/data-model phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

**Key Implementation Points:**
- Group model: id, name, slug (unique), created_by, invite_code (unique 6 chars)
- Group members: groupId, userId, role (captain/manager/player from Phase 1 CONTEXT.md), joinedAt
- Leaderboard: Query players by avg_overall DESC, limit to group members
- Group page: /group/[slug] with leaderboard, match history, members list, invite button
- Invite code generation: nanoid(6) for easy sharing
- Match association: matches.groupId → groups.id (optional)
- Multiple organizers: captain+manager roles can both manage the group

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 8 — Phase 8 goal, success criteria, and requirements (GROUP-01 through GROUP-08, MATCH-08)
- `.planning/REQUIREMENTS.md` — Full requirements specification for groups and leaderboards
- `CLAUDE.md` — Project instructions, conventions, mobile-first principles

### Database Schema
- `src/db/schema.ts` — Complete database schema with groups, group_members tables; role enum (captain/manager/player)

### Prior Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Captain/Manager/Player role system (not just organizer/player)
- `.planning/phases/02-match-creation-guest-rsvp/02-CONTEXT.md` — Guest flow patterns

### Existing Components
- `src/components/ui/` — shadcn/ui components available
- `src/lib/design-tokens.ts` — Design tokens including colors, statusBadges

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components** — button, input, card, badge, avatar, sonner (toast), dropdown-menu, dialog
- **Design system** — FootballIcon for domain concepts, mobile-first color palette
- **Auth system** — better-auth configured with session management
- **Database schema** — groups and group_members tables already defined with role enum

### Established Patterns
- **Mobile-first design** — All UI must work on iPhone SE (375px)
- **Server Components by default** — Use "use client" only for interactivity
- **Toast notifications** — Sonner with top-center positioning
- **Server Actions in lib/actions/** — Next.js 16 requires Actions outside app/api/ directory
- **Unique identifiers** — nanoid for invite codes, uuid for primary keys

### Integration Points
- **Group creation** — Form to create group with name and auto-generated slug
- **Invite codes** — Generate 6-char code, shareable link /group/{slug}/join?code={code}
- **Leaderboard query** — Join player_stats with users filtered by group members
- **Match association** — Optional groupId field in matches table
- **Role management** — Captain/Manager can edit group, Players are read-only

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

*Phase: 08-groups-leaderboards*
*Context gathered: 2026-03-31*
