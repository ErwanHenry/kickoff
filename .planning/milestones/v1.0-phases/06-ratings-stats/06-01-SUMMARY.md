---
phase: 06
plan: 01
title: "Rating Submission System"
subsystem: "Ratings & Stats"
tags: ["ratings", "stats", "server-action", "components"]
wave: 1
depends_on: []
dependency_graph:
  requires: []
  provides: ["06-02"]
  affects: []
tech_stack:
  added: []
  patterns: ["Incremental average calculation", "Guest token auth"]
key_files:
  created:
    - path: src/lib/validations/rating.ts
      provides: "Zod validation schema for rating submissions"
      exports: ["ratingSchema", "RatingInput", "PlayerRatingInput"]
    - path: src/lib/db/queries/ratings.ts
      provides: "Database queries for rating operations"
      exports: ["getMatchPlayersForRating", "getExistingRatings", "insertRatings", "updatePlayerStats", "countDistinctRaters"]
    - path: src/lib/actions/ratings.ts
      provides: "Server Action for submitting ratings"
      exports: ["submitRatings"]
    - path: src/components/rating/star-input.tsx
      provides: "Touch-friendly star rating component"
      lines: 114
    - path: src/components/rating/player-rating-card.tsx
      provides: "Player card with 3-axis rating inputs"
      lines: 132
  modified: []
key_decisions: []
---

# Phase 06 Plan 01: Rating Submission System Summary

Build the rating submission system allowing players to rate teammates on 3 axes (technique, physique, collectif) after a played match. Players can rate each teammate with 1-5 stars, add optional comments (max 280 chars), and ratings are anonymous — rated players see averages, not rater identity. Both guests (via guest token) and authenticated users can rate matches they participated in. Player statistics are recalculated incrementally after each rating. The match status changes to "rated" when ≥50% of players have rated.

## One-Liner

Implemented complete rating submission flow with 3-axis star ratings, incremental stats recalculation, guest/user auth support, and touch-friendly mobile UI components.

## Files Created/Modified

### Created

1. **src/lib/validations/rating.ts**
   - Zod validation schema for rating submissions
   - Validates 1-5 range for each axis (technique, physique, collectif)
   - 280 character limit for comments
   - Exports `RatingInput` and `PlayerRatingInput` types

2. **src/lib/db/queries/ratings.ts**
   - `getMatchPlayersForRating()`: Returns attended=true players, excludes rater
   - `getExistingRatings()`: Fetches already-submitted ratings for duplicate check
   - `insertRatings()`: Transactional insert with UNIQUE constraint handling
   - `updatePlayerStats()`: Incremental average calculation using formula: `new_avg = ((old_avg * n) + new_rating) / (n + 1)`
   - `countDistinctRaters()`: Counts raters for 50% threshold check

3. **src/lib/actions/ratings.ts**
   - Server Action `submitRatings()` handling both user (session) and guest (cookie) auth
   - Reads guest_token from "guest_token" cookie for guest identification
   - Verifies rater participated in match (attended=true check)
   - Prevents duplicate ratings via UNIQUE constraint on (match_id, rater_id, rated_id)
   - Recalculates player stats incrementally after each rating
   - Updates match status to "rated" when 50% threshold reached
   - Revalidates paths for match, rate page, and public rate page

4. **src/components/rating/star-input.tsx**
   - Touch-friendly 44x44px star buttons for mobile (meets accessibility guidelines)
   - Uses FootballIcon name="star" per CLAUDE.md design system
   - Visual states: empty (text-slate-light), filled (text-yellow-card)
   - Hover effect with 1.1 scale animation
   - Keyboard navigation: arrow keys, Enter, Space
   - Focus ring with ring-pitch color
   - Disabled state with opacity-50 and pointer-events-none
   - Label with font-sans, text-sm, text-muted-foreground

5. **src/components/rating/player-rating-card.tsx**
   - Composes StarInput for 3-axis rating (technique, physique, collectif)
   - Avatar circle with player initials, bg-pitch background, 40px size
   - Comment textarea with 280 char limit and character counter
   - Character counter turns red (text-red-card) at 260+ chars
   - Visual feedback: green left border when any rating present
   - Mobile-optimized spacing with gap-4 and p-4 padding
   - Uses design system: bg-chalk-pure, shadow-card, rounded-card
   - Calls onChange/onCommentChange on user interaction
   - Supports disabled state with opacity changes

### Modified

None

## Verification Results

### Build Verification
- ✅ `pnpm typecheck` passed
- ✅ `pnpm build` succeeded
- ✅ No console errors

### Component Verification
- ✅ StarInput uses FootballIcon name="star"
- ✅ StarInput has role="radio" for accessibility
- ✅ StarInput has 44x44px touch targets (w-11 h-11)
- ✅ PlayerRatingCard composes StarInput
- ✅ PlayerRatingCard has 280 char limit with counter

### Database Query Verification
- ✅ getMatchPlayersForRating filters by attended=true
- ✅ getMatchPlayersForRating excludes rater from results
- ✅ updatePlayerStats calculates incremental averages correctly
- ✅ UNIQUE constraint prevents duplicate ratings

### Server Action Verification
- ✅ Handles both user (session) and guest (cookie) auth
- ✅ Verifies rater attended the match (attended=true)
- ✅ Verifies match status is "played" or "rated"
- ✅ Transaction wraps insert + stats update
- ✅ Updates match to "rated" at 50% threshold

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None encountered during this plan execution.

## Known Stubs

None - all artifacts are fully functional.

## Next Steps for Plan 06-02

The rating submission system components and server action are complete. Plan 06-02 should:

1. Create the rating page routes for both authenticated users and guests
2. Build the rating form UI that lists all match players (excluding self)
3. Handle form submission with the submitRatings Server Action
4. Show success state with CTA for guest account creation
5. Add loading states and error handling for the rating flow
6. Integrate with existing match detail and attendance pages

**Key files to create in 06-02:**
- `src/app/m/[shareToken]/rate/page.tsx` - Guest rating page (Server Component)
- `src/app/match/[id]/rate/page.tsx` - Authenticated user rating page
- `src/components/rating/rating-form.tsx` - Main rating form component
- Update existing pages to link to rating pages after match closure

**Dependencies on 06-01:**
- Use `submitRatings` Server Action from `src/lib/actions/ratings.ts`
- Use `StarInput` and `PlayerRatingCard` components
- Use `getMatchPlayersForRating` query to fetch players
- Use `ratingSchema` for form validation

## Self-Check: PASSED

- ✅ All files exist: src/lib/validations/rating.ts, src/lib/db/queries/ratings.ts, src/lib/actions/ratings.ts, src/components/rating/star-input.tsx, src/components/rating/player-rating-card.tsx
- ✅ All commits exist: 8fc21b1 (validation+queries), f608b05 (server-action), c456485 (star-input), cccb4d6 (player-card)
- ✅ Type check passed
- ✅ Build passed
