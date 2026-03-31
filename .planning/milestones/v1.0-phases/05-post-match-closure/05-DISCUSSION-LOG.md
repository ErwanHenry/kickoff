# Phase 5: Post-Match Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 5-Post-Match-Closure
**Areas discussed:** Attendance marking UI, Score input format, Summary & field requirements, Timing & permissions

---

## Attendance marking UI

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle list (switches) | List of confirmed players with toggle switches — simple, familiar, works well on mobile. You already use shadcn/ui checkbox component. | ✓ |
| Card-based selection | Player cards that highlight when tapped — more visual, larger touch targets, but takes more screen space | |
| Two-column grid | Split view with 'Présents' and 'Absents' columns — drag players between them or tap to move (more complex but clearer overview) | |

**User's choice:** Toggle list (switches)
**Notes:** Simple toggle list with checkbox/switch for each confirmed player. Default all to "Present", organizer only changes the no-shows.

---

## Score input format

| Option | Description | Selected |
|--------|-------------|----------|
| Number inputs | Two number inputs side by side — 'Équipe A [__] - [__] Équipe B'. Simple, standard HTML5 number input with +/- buttons. | ✓ |
| Score dropdown | Dropdown selector with common scores (0-0, 1-0, 1-1, 2-0, 2-1, 2-2, 3-0, etc.) plus 'Autre' for custom entry. Faster for typical scores. | |
| Plus/minus buttons | Custom increment/decrement buttons — '+' and '-' for each team with a minimum of 0. No keyboard needed, all touch-friendly. | |

**User's choice:** Number inputs
**Notes:** Standard HTML5 number inputs, min 0, max 99, step 1. Default 0-0.

---

## Summary & field requirements

| Option | Description | Selected |
|--------|-------------|----------|
| Score required, rest optional | Score required (default 0-0), attendance required (all marked present by default), summary optional (plain textarea, max 500 chars). | ✓ |
| Score + attendance required | Score AND attendance both required (block submission until all confirmed players are marked present/absent), summary optional. | |
| All optional | All three optional — organizer can close with just score, just attendance, or both. Default: 0-0 score, all confirmed marked present. | |

**User's choice:** Score required, rest optional
**Notes:** Score is required, attendance marking required (with default "all present"), summary optional with 500 char limit.

---

## Timing & permissions

| Option | Description | Selected |
|--------|-------------|----------|
| After locked + date passed | Only after match is 'locked' (teams finalized) AND match date has passed. Prevents premature closure. | |
| After date passed only | Anytime after the match date, regardless of lock status. Allows closing even if teams weren't officially generated. | |
| Anytime | Any time at all — organizer can close matches in advance or before locking. Useful for rescheduled/cancelled matches. | ✓ |

**User's choice:** Anytime
**Notes:** Organizer can close any match at any time. Flexible for rescheduled/cancelled matches.

---

## Claude's Discretion

None — all decisions were explicitly made by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
