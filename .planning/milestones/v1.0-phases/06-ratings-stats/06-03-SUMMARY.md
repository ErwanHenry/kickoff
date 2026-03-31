# Phase 06 Plan 03: Player Stats Recalculation — Summary

**Phase:** 06-ratings-stats
**Plan:** 03
**Completed:** 2026-03-31
**Duration:** ~15 minutes

## Objective

Complete the player stats recalculation system with incremental updates and match status tracking. Ensure player statistics are accurately maintained after each rating, enabling intelligent team balancing in future matches.

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Create stats calculation utilities library | `afa8a25` | `src/lib/stats.ts` |
| 2 | Add stats queries to ratings module | `efbca7b` | `src/lib/db/queries/ratings.ts` |
| 3 | Update submitRatings with stats integration | `183de77` | `src/lib/actions/ratings.ts` |
| 4 | Add progress indicator to rating pages | `8479cbc` | `src/components/rating/rating-form.tsx`, `src/app/m/[shareToken]/rate/page.tsx`, `src/app/match/[id]/rate/page.tsx` |

## Files Created

### `src/lib/stats.ts` (134 lines)
**Provides:** Stats calculation utilities library

**Exports:**
- `parseDecimal(value: string | null | undefined): number` — Safe decimal string parsing
- `calculateIncrementalAverage(oldAverage, oldCount, newValue): number` — Incremental average formula: `((oldAverage * oldCount) + newValue) / (oldCount + 1)`
- `calculateWeightedOverall(technique, physique, collectif): number` — Weighted average: `technique * 0.4 + physique * 0.3 + collectif * 0.3`
- `updatePlayerStatsFromRatings(ratings, currentStats): StatsUpdate` — Batch rating aggregation with incremental formula

## Files Modified

### `src/lib/db/queries/ratings.ts` (+227 lines)
**Changes:**
- Added imports: `updatePlayerStatsFromRatings`, `parseDecimal` from `@/lib/stats`
- Added `getPlayerStats(userId, groupId?)` — Fetch user stats with optional group filter
- Added `createOrUpdatePlayerStats(userId, groupId, newRatings)` — Upsert stats record from batch
- Added `updateMatchRatedStatus(matchId, tx?)` — Check 50% threshold and update status to "rated"
- Added `getMatchRatersCount(matchId)` — Count distinct raters for progress
- Added `getMatchConfirmedCount(matchId)` — Count attended confirmed players
- Added `getMatchRatingProgress(matchId)` — Combine counts with status for UI

### `src/lib/actions/ratings.ts` (+48 lines, -39 lines)
**Changes:**
- Updated imports: Use `createOrUpdatePlayerStats` and `updateMatchRatedStatus`
- Enhanced transaction block:
  - Group ratings by ratedId before transaction
  - Call `createOrUpdatePlayerStats` for each player (handles both create and update)
  - Call `updateMatchRatedStatus` with transaction instance
  - Added error handling (log but don't fail transaction)
- Enhanced revalidation: Added `/player/{ratedId}` for each rated player (Phase 7 future-proofing)
- Updated response: Added `matchStatusUpdated` flag (indicates if match changed to "rated")

### `src/components/rating/rating-form.tsx` (+51 lines)
**Changes:**
- Added `ratingProgress` prop to interface
- Added progress indicator display:
  - Progress bar (visual div with width %)
  - Color: `bg-lime-glow` when <50%, `bg-pitch` when >=50%
  - Text: "X/Y joueurs ont noté" (font-mono)
  - Badge: "Complété" when `isRated=true`

### `src/app/m/[shareToken]/rate/page.tsx`
**Changes:**
- Added import: `getMatchRatingProgress`
- Fetch rating progress server-side
- Pass `ratingProgress` to RatingForm

### `src/app/match/[id]/rate/page.tsx`
**Changes:**
- Added import: `getMatchRatingProgress`
- Fetch rating progress server-side
- Pass `ratingProgress` to RatingForm

## Deviations from Plan

**None — plan executed exactly as written.**

All tasks completed according to specification with no auto-fixes required.

## Key Technical Decisions

1. **Transaction Instance Type Handling:** Used `any` type for `updateMatchRatedStatus` transaction parameter due to Drizzle ORM's complex type system. Transaction and connection types are not compatible at the type level, but functionally equivalent for our use case.

2. **Stats Update Error Handling:** Wrapped `createOrUpdatePlayerStats` calls in try/catch within transaction. Logs errors but doesn't fail transaction — ratings are primary, stats are secondary.

3. **Progress Indicator Location:** Placed progress indicator below the existing "your ratings" badge in the header. Shows both personal progress (X/Y players you rated) and overall progress (X/Y players who rated).

4. **Future-Proofing:** Added `/player/{ratedId}` revalidation for each rated player. This prepares for Phase 7 (Player Profiles) without blocking current implementation.

## Verification Results

### Build Verification
- [x] `pnpm typecheck` passes
- [x] `pnpm build` succeeds with no warnings
- [x] All imports resolve correctly

### Code Verification
- [x] `calculateIncrementalAverage` implements correct formula
- [x] `calculateWeightedOverall` uses 40/30/30 weights
- [x] `updatePlayerStatsFromRatings` handles multiple ratings
- [x] All functions handle decimal strings correctly
- [x] `getPlayerStats` fetches by userId with optional groupId
- [x] `createOrUpdatePlayerStats` upserts correctly
- [x] `updateMatchRatedStatus` checks 50% threshold and updates status
- [x] Count queries return correct numbers
- [x] `submitRatings` groups ratings by ratedId
- [x] `submitRatings` calls `createOrUpdatePlayerStats` for each player
- [x] `submitRatings` calls `updateMatchRatedStatus` after stats updated
- [x] `submitRatings` uses transaction db throughout
- [x] `submitRatings` returns `matchStatusUpdated` flag
- [x] Rating progress shows X/Y format
- [x] Progress bar displays visually
- [x] Color changes at 50% threshold
- [x] "Complété" badge shows when rated

### End-to-End Flow
1. **Rating submission:**
   - User/guest submits ratings via RatingForm
   - `submitRatings` Server Action groups ratings by ratedId
   - Ratings inserted in transaction
   - Stats updated via `createOrUpdatePlayerStats` (incremental formula)
   - Match status updated to "rated" if 50% threshold reached
   - Paths revalidated (match, rate pages, player profiles)

2. **Progress indicator:**
   - Server fetches rating progress on page load
   - Displays X/Y players rated, progress bar, "Complété" badge
   - Updates reflect real-time participation

## Phase 6 Completion Summary

**Phase 6: Ratings & Stats — COMPLETE**

All 3 plans in Phase 6 executed successfully:
- **Plan 06-01:** Rating system infrastructure (database schema, queries, Server Action)
- **Plan 06-02:** Rating UI components (RatingForm, PlayerRatingCard, StarInput, rating pages)
- **Plan 06-03:** Stats recalculation (incremental updates, match status tracking, progress indicator)

### Requirements Satisfied
- [x] RATE-07: Player stats recalculated incrementally after each rating batch
- [x] RATE-08: Match status changes to "rated" when 50%+ of confirmed players have rated

### Key Capabilities Delivered
1. **3-Axis Rating System:** Technique (40%), Physique (30%), Collectif (30%)
2. **Incremental Stats Update:** Efficient recalculation without full table scans
3. **Match Status Tracking:** Automatic "rated" status at 50% threshold
4. **Progress Indicator:** Real-time visual feedback on rating participation
5. **Guest + User Support:** Both guest tokens and user IDs supported
6. **Idempotent Rating Submission:** Prevents duplicates, handles re-submissions
7. **Atomic Transactions:** Ratings and stats updated in same transaction

## Next Steps

### Phase 7: Player Profiles — Ready to Start

**Prerequisites Complete:**
- Stats calculation utilities (`src/lib/stats.ts`)
- Player stats queries (`getPlayerStats`, `createOrUpdatePlayerStats`)
- Ratings data structure (3-axis scores, comments)
- Profile path revalidation integrated

**Phase 7 Plans:**
- **07-01:** Player profile page (stats overview, radar chart, match history, comments)
- **07-02:** Profile navigation integration (links from match ratings, leaderboard)

**Enablers for Future Phases:**
- **Phase 8 (Groups & Leaderboards):** Stats by groupId enable group-level rankings
- **Phase 9 (Team Balancing):** Player stats (avg_overall) feed into balancing algorithm
- **Phase 10 (Guest Merge):** Stats update triggered on account creation

## Metrics

| Metric | Value |
|--------|-------|
| Duration | ~15 minutes |
| Tasks | 4 tasks (all auto) |
| Files Created | 1 (`src/lib/stats.ts`) |
| Files Modified | 4 |
| Commits | 4 (one per task) |
| Lines Added | ~460 lines |
| Build Time | ~23s (TypeScript) |
| Type Check | Pass |
| Deviations | 0 |

---

**Phase 06 Status:** ✅ COMPLETE
**Next Phase:** 07 (Player Profiles)
**Blockers:** None
