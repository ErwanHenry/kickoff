---
phase: 06
plan: 02
title: "Rating Page Routes"
subsystem: "Ratings & Stats"
tags: ["ratings", "pages", "guest-flow", "user-flow"]
wave: 2
depends_on: ["06-01"]
dependency_graph:
  requires: ["06-01"]
  provides: ["06-03"]
  affects: []
tech_stack:
  added: []
  patterns: ["Server Components with auth checks", "Guest token from cookies"]
key_files:
  created:
    - path: src/components/rating/rating-form.tsx
      provides: "Shared rating form for guest and user flows"
      lines: 306
    - path: src/app/m/[shareToken]/rate/page.tsx
      provides: "Guest rating page (no auth required)"
      lines: 220
    - path: src/app/match/[id]/rate/page.tsx
      provides: "User rating page (auth required)"
      lines: 202
  modified:
    - path: src/lib/db/queries/ratings.ts
      changes: "Added getMatchByShareToken and verifyMatchPlayed functions"
key_decisions: []
---

# Phase 06 Plan 02: Rating Page Routes Summary

Create rating page routes for both guest and user flows, enabling players to rate teammates after a played match. Both flows use the same RatingForm component for consistency. Guest flow reads guest_token from cookies, user flow uses session authentication. Post-submit flow differs: guests see CTA to create account, users redirect to match detail.

## One-Liner

Implemented dual rating page routes (guest + user) with shared RatingForm component, proper auth handling, and distinct post-submit flows.

## Files Created/Modified

### Created

1. **src/components/rating/rating-form.tsx** (306 lines)
   - Shared rating form component for both guest and user flows
   - Mobile-first design with max-w-2xl container
   - Header: "Note tes coéquipiers" + match date/location + progress badge (X/Y players rated)
   - Players list with PlayerRatingCard for each teammate
   - Sticky submit button with validation (at least one rating required)
   - Loading state with spinner during submission
   - Post-submit success state: guest sees CTA card, user redirects after 2s
   - Toast notifications for success/error via Sonner
   - Warning for unrated players below submit button
   - Character counter and unrated player warning

2. **src/app/m/[shareToken]/rate/page.tsx** (220 lines)
   - Guest rating page accessible without authentication
   - Server Component for OG metadata and fast initial load
   - Fetches match by shareToken via getMatchByShareToken()
   - Reads guest_token from "kickoff_guest_token" cookie
   - Verifies match status is "played" or "rated" via verifyMatchPlayed()
   - Verifies guest participated (attended=true check)
   - Fetches players to rate (excluding self) via getMatchPlayersForRating()
   - Fetches existing ratings via getExistingRatings()
   - Renders RatingForm with isGuest=true
   - Error states: match not found, match not played, guest not identified, guest didn't attend, no players to rate
   - Loading skeleton with card animations

3. **src/app/match/[id]/rate/page.tsx** (202 lines)
   - User rating page requires authentication
   - Server Component with auth check via auth.api.getSession()
   - Redirects to /login?redirect=/match/{id}/rate if not authenticated
   - Fetches match by matchId via getMatchById()
   - Verifies match status is "played" or "rated"
   - Verifies user participated (attended=true check)
   - Fetches players to rate (excluding self)
   - Fetches existing ratings
   - Renders RatingForm with isGuest=false
   - Same error states and loading skeleton as guest page
   - Same layout and mobile-first design

### Modified

1. **src/lib/db/queries/ratings.ts**
   - Added `getMatchByShareToken(shareToken)`: Query matches table by shareToken, returns match with id, title, date, location, status, shareToken, groupId
   - Added `verifyMatchPlayed(match)`: Check match status is "played" or "rated", returns boolean
   - Updated `getExistingRatings()`: Returns full rating object (technique, physique, collectif, comment) instead of just ratedId
   - Transforms null comments to undefined for type compatibility

## Deviations from Plan

**Rule 2 - Auto-add missing critical functionality:**
- **Found during:** Task 2 (guest rating page)
- **Issue:** getExistingRatings only returned ratedId, but RatingForm needed full rating object to initialize state
- **Fix:** Updated getExistingRatings to return technique, physique, collectif, comment fields
- **Files modified:** src/lib/db/queries/ratings.ts
- **Commit:** 4231208

## Auth Gates

None encountered during this plan execution. Both guest and user flows work correctly with existing authentication mechanisms (guest_token cookie and session).

## Verification Results

### Build Verification
- ✅ `pnpm typecheck` passed (after fixing TypeScript errors)
- ✅ `pnpm build` succeeded
- ✅ All routes registered in build output: `/m/[shareToken]/rate`, `/match/[id]/rate`

### Guest Flow Check
- ✅ Guest rating page accessible at /m/{shareToken}/rate without auth
- ✅ Reads guest_token from cookies correctly
- ✅ Shows error if guest didn't attend match
- ✅ Shows error if match not played yet
- ✅ Fetches players and existing ratings correctly

### User Flow Check
- ✅ User rating page accessible at /match/{id}/rate with auth
- ✅ Unauthenticated users redirected to /login
- ✅ Uses session.user.id for identification
- ✅ Shows error if user didn't attend match
- ✅ Verifies match status before allowing ratings

### Shared Form Check
- ✅ RatingForm component used by both routes
- ✅ Displays all attended players except rater
- ✅ Tracks ratings state correctly per player
- ✅ Submit button enables when ratings provided
- ✅ Progress indicator updates (X/Y players rated)

### Post-Submit Flow Check
- ✅ Guest sees CTA to create account after submission
- ✅ User redirects to match detail after 2s
- ✅ Toast notifications appear for success/error

### Type Safety
- ✅ Fixed TypeScript errors:
  - getExistingRatings returns full rating object
  - Null comments transformed to undefined
  - RatingForm state updates ensure type safety
  - ratingsCount undefined access handled

## Known Stubs

None - all artifacts are fully functional.

## Next Steps for Plan 06-03

Plan 06-03 should focus on stats recalculation refinement:

1. **Optimize player stats recalculation** - Batch updates when multiple ratings received
2. **Add player stats caching** - Reduce database queries for frequently accessed profiles
3. **Implement stats history tracking** - Track rating trends over time
4. **Add leaderboard queries** - Sort players by avg_overall within groups
5. **Create player profile page** - Display stats, radar chart, match history

**Key files to create in 06-03:**
- `src/lib/db/queries/player-stats.ts` - Optimized stats queries
- `src/app/player/[id]/page.tsx` - Player profile page
- `src/components/player/stats-overview.tsx` - Stats display component
- `src/components/player/radar-chart.tsx` - Technique/physique/collectif visualization

**Dependencies on 06-02:**
- Rating pages are complete and functional
- Player stats are being updated after each rating
- Both guest and user flows work correctly

## Metrics

- **Duration:** ~8 minutes
- **Tasks:** 4 tasks completed
- **Files:** 3 files created, 1 file modified
- **Commits:** 5 commits (including TypeScript fixes)
- **Lines:** ~730 lines added (306 + 220 + 202 + type fixes)

## Self-Check: PASSED

- ✅ All files exist: src/components/rating/rating-form.tsx, src/app/m/[shareToken]/rate/page.tsx, src/app/match/[id]/rate/page.tsx
- ✅ All commits exist: 767e9f0 (rating-form), 1439ee8 (queries), 26a130b (guest-page), 1d50730 (user-page), 4231208 (ts-fixes)
- ✅ Type check passed
- ✅ Build passed
- ✅ Both routes appear in build output
- ✅ Guest flow works without auth
- ✅ User flow redirects unauthenticated
- ✅ Post-submit flows differ correctly (guest CTA vs user redirect)
