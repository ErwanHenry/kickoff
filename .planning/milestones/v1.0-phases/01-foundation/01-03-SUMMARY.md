---
phase: 01-foundation
plan: 03
subsystem: database
tags: [drizzle, neon, postgresql, schema]
dependency_graph:
  requires: [01-01]
  provides: [db-schema, db-connection, type-exports]
  affects: [01-04, 01-05, 02-*]
tech_stack:
  added: [drizzle-orm@0.45.2, "@neondatabase/serverless@1.0.2", drizzle-kit@0.31.10]
  patterns: [neon-http-driver, drizzle-relations, type-inference]
key_files:
  created:
    - drizzle.config.ts
    - src/db/index.ts
    - src/db/schema.ts
  modified:
    - package.json
decisions:
  - "Used captain|manager|player for group_role enum per CONTEXT.md (not organizer|player)"
  - "Used neon-http driver for serverless (not postgres driver)"
  - "Added GroupMember type export (missing from plan template)"
metrics:
  duration: ~5min
  completed: 2026-03-30
  tasks: 3/3
---

# Phase 01 Plan 03: Database Schema with Drizzle/Neon Summary

Drizzle ORM with Neon PostgreSQL serverless, defining complete schema with 6 tables and captain/manager/player role system.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Drizzle ORM and Neon driver | 3f4dcf9 | package.json, pnpm-lock.yaml |
| 2 | Create Drizzle config and Neon connection | 3f4dcf9 | drizzle.config.ts, src/db/index.ts |
| 3 | Define complete database schema | 3f4dcf9 | src/db/schema.ts |

## Key Implementation Details

### Schema Structure (6 tables)

1. **users** - Core user data (email, name, phone)
2. **groups** - Football groups with slug and invite_code
3. **group_members** - Junction table with role enum (captain|manager|player)
4. **matches** - Match details with status workflow, recurrence, scores
5. **match_players** - Player participation with status, team assignment, guest support
6. **ratings** - 3-axis rating system (technique, physique, collectif)
7. **player_stats** - Aggregated stats per user (optionally per group)

### Enums Defined

- `match_status`: draft | open | full | locked | played | rated
- `player_status`: confirmed | waitlisted | cancelled | no_show
- `team`: A | B
- `recurrence`: none | weekly
- `group_role`: captain | manager | player

### Type Exports

All tables export both Select and Insert types:
- `User`, `NewUser`
- `Group`, `NewGroup`
- `GroupMember`, `NewGroupMember`
- `Match`, `NewMatch`
- `MatchPlayer`, `NewMatchPlayer`
- `Rating`, `NewRating`
- `PlayerStats`, `NewPlayerStats`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] `pnpm typecheck` passes
- [x] Schema contains captain|manager|player roles
- [x] All 6 tables defined with relations
- [x] drizzle.config.ts configured for PostgreSQL Neon
- [x] src/db/index.ts exports db connection

## Self-Check: PASSED

- [x] FOUND: drizzle.config.ts
- [x] FOUND: src/db/index.ts
- [x] FOUND: src/db/schema.ts
- [x] FOUND: commit 3f4dcf9
