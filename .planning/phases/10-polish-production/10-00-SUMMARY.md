---
phase: 10
plan: 00
title: "Test Infrastructure for Phase 10"
subsystem: "Polish & Production"
tags: ["testing", "tdd", "og-images", "emails", "guest-merge"]
wave: 0

requirements:
  provides: ["test-contracts"]
  affects: ["10-01-PLAN.md", "10-02-PLAN.md", "10-03-PLAN.md"]

tech-stack:
  added: []
  patterns: ["TDD stubs", "fixture data", "mocked dependencies"]

key-files:
  created:
    - "src/lib/__tests__/unit/og.test.ts"
    - "src/lib/__tests__/unit/emails.test.ts"
    - "src/lib/__tests__/unit/merge.test.ts"
    - "src/lib/__tests__/fixtures/match.ts"
    - "src/lib/__tests__/fixtures/user.ts"

decisions: []

metrics:
  duration: "3 minutes"
  completed_date: "2026-03-31T20:25:00Z"
  tasks_completed: 5
  files_created: 5
  test_stubs_created: 33
---

# Phase 10 Plan 00: Test Infrastructure Summary

**Objective:** Create test infrastructure stub files for Phase 10 implementation (OG images, email notifications, guest-to-user merge)

**Approach:** TDD methodology — define test contracts before implementation to ensure all features are verifiable and meet requirements

## What Was Built

### Test Stub Files (33 test scenarios)

1. **src/lib/__tests__/unit/og.test.ts** (9 tests)
   - SHARE-01: Match link generates OG preview for WhatsApp
   - SHARE-02: OG image displays match info (title, date, location, confirmed count)
   - Covers: title rendering, fallback, special chars, player count badge, location truncation, color scheme, date formatting, image dimensions, edge cases

2. **src/lib/__tests__/unit/emails.test.ts** (12 tests)
   - NOTIF-01: Waitlisted player receives email when promoted
   - NOTIF-02: Player receives reminder 2h before deadline
   - NOTIF-03: Players receive email after match to rate teammates
   - NOTIF-04: Group members receive email when new weekly match created
   - NOTIF-05: New user receives welcome email
   - Covers: plain text format, notification preferences, Resend client usage, missing email handling

3. **src/lib/__tests__/unit/merge.test.ts** (12 tests)
   - AUTH-05: Guest can create account and merge all match history
   - Covers: match_players updates, ratings reattribution, stats recalculation, edge cases (no history, existing account, missing cookie), transaction atomicity, data integrity

### Fixture Files

4. **src/lib/__tests__/fixtures/match.ts**
   - matchWithTitle, matchWithoutTitle, matchWithLongLocation, matchWithSpecialChars
   - Provides realistic test data for OG and email tests
   - Uses nanoid(10) for shareTokens

5. **src/lib/__tests__/fixtures/user.ts**
   - userWithEmail, userWithoutEmail, newRegisteredUser
   - guestTokens (valid, expired) for merge tests
   - Provides realistic test data for merge and email tests

## Design Decisions Referenced

From `10-CONTEXT.md`:

- **D-01 through D-08:** OG image design specs (1200x630px, kickoff colors, DM Sans font, truncation rules)
- **D-09:** Plain text emails (simple, fast, works everywhere)
- **D-11:** Email types (waitlist promotion, deadline reminder, post-match rating, welcome)
- **D-15 through D-18:** Guest merge strategy (match_players, ratings, stats recalculation)

## Test Contracts Established

Each test stub documents expected behavior with comments, providing clear contracts for implementation:

- **Expected values:** Colors (#2D5016, #4ADE80), dimensions (1200x630), truncation length (25 chars)
- **Expected behavior:** Mock functions, database queries, API responses
- **Edge cases:** Missing data, special characters, empty history, existing accounts

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- [x] All 5 test files exist in src/lib/__tests__/ directory
- [x] `pnpm test --run` executes successfully (80 tests pass, including new stubs)
- [x] Total test stubs: 33 test.it() blocks across 3 files (9 OG + 12 email + 12 merge)
- [x] Each stub has comment documenting expected behavior
- [x] Fixtures are importable (no syntax errors)
- [x] TypeScript compilation passes: `pnpm typecheck`

## Next Steps

Implementation plans will use these test contracts:

- **10-01-PLAN.md (OG implementation):** Tests must pass after implementation
- **10-02-PLAN.md (Email implementation):** Tests must pass after implementation
- **10-03-PLAN.md (Guest merge):** Tests must pass after implementation

## Self-Check: PASSED

- [x] All fixture files created: match.ts, user.ts
- [x] All test stub files created: og.test.ts, emails.test.ts, merge.test.ts
- [x] Commits exist: 7614502 (fixtures), 9af9c5c, 43bac0f, c7d462a, 5d771ee
- [x] Tests execute: `pnpm test --run` passes
- [x] TypeScript compiles: `pnpm typecheck` passes
