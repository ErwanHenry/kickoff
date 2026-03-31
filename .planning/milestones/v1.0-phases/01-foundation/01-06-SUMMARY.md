---
phase: 01-foundation
plan: 06
subsystem: infra
tags: [pwa, service-worker, manifest, vercel, offline]

requires:
  - phase: 01-01
    provides: Next.js 15 setup with App Router

provides:
  - PWA manifest with standalone display mode
  - Service worker with cache-first shell strategy
  - Offline page with "Hors ligne" message
  - PWA icons (192x192, 512x512) with football design
  - Vercel security headers configuration

affects: [deployment, mobile-install, offline-experience]

tech-stack:
  added: []
  patterns: [native-manifest, manual-service-worker, cache-first-shell]

key-files:
  created:
    - src/app/manifest.ts
    - public/sw.js
    - public/icon-192x192.svg
    - public/icon-512x512.svg
    - src/components/service-worker-register.tsx
    - src/app/offline/page.tsx
    - vercel.json
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Used native Next.js manifest.ts instead of next-pwa (Turbopack conflicts)"
  - "Separate icon entries for 'any' and 'maskable' purposes (TypeScript strict)"
  - "Cache-first for shell, network-first for API calls"

patterns-established:
  - "PWA manifest via src/app/manifest.ts exported function"
  - "Service worker registration via client component"
  - "Offline fallback page at /offline"

requirements-completed: [PWA-01, PWA-02, PWA-03, PWA-04]

duration: 8min
completed: 2026-03-30
---

# Phase 1 Plan 6: PWA Configuration Summary

**PWA infrastructure with native Next.js manifest, service worker caching, and Vercel security headers**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T07:51:33Z
- **Completed:** 2026-03-30T07:59:00Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments

- PWA manifest with standalone display mode and kickoff branding (D-12, D-13)
- Service worker with cache-first shell, network-first API strategy
- Offline page showing "Hors ligne" message (D-11)
- Football icons on green background (D-14)
- Vercel security headers (X-Content-Type-Options, X-Frame-Options, etc.)

## Task Commits

1. **All Tasks** - `1516345` (feat: PWA configuration)

## Files Created/Modified

- `src/app/manifest.ts` - PWA manifest with app metadata
- `public/sw.js` - Service worker with caching strategies
- `public/icon-192x192.svg` - PWA icon 192x192
- `public/icon-512x512.svg` - PWA icon 512x512
- `src/components/service-worker-register.tsx` - Client component for SW registration
- `src/app/offline/page.tsx` - Offline fallback page
- `src/app/layout.tsx` - Updated with PWA meta tags and SW registration
- `vercel.json` - Security headers and SW configuration

## Decisions Made

- Used native Next.js `manifest.ts` instead of next-pwa due to Turbopack conflicts (per research)
- Split icon purposes into separate entries (`any` and `maskable`) for TypeScript strict compliance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed manifest icon purpose type error**
- **Found during:** Task 1 (Create PWA manifest)
- **Issue:** TypeScript rejected `"any maskable"` string - needs separate entries
- **Fix:** Created separate icon entries for `"any"` and `"maskable"` purposes
- **Files modified:** src/app/manifest.ts
- **Verification:** `pnpm typecheck` passes
- **Committed in:** 1516345

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor TypeScript compliance fix. No scope creep.

## Issues Encountered

- Build fails due to missing DATABASE_URL env var (pre-existing issue from Plan 01-03, not caused by this plan)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PWA infrastructure complete
- App is installable on mobile devices
- Offline shell caching ready
- Security headers configured for Vercel deployment
- Ready for Plan 01-07 (seed script)

---
*Phase: 01-foundation*
*Completed: 2026-03-30*
