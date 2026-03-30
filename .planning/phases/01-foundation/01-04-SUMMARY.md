---
phase: 01-foundation
plan: 04
subsystem: auth
tags: [better-auth, magic-link, session, middleware]
dependency-graph:
  requires: [01-03]
  provides: [auth-server, auth-client, route-protection]
  affects: [dashboard, login, register]
tech-stack:
  added: [better-auth@1.5.6, resend@6.9.4]
  patterns: [drizzle-adapter, magic-link-plugin]
key-files:
  created:
    - src/lib/auth.ts
    - src/lib/auth-client.ts
    - src/app/api/auth/[...all]/route.ts
    - src/middleware.ts
  modified:
    - package.json
decisions:
  - Removed experimental.optimizeDatabaseQueries (not in better-auth 1.5.6 types)
  - Added /register to public routes (needed for signup flow)
metrics:
  duration: ~5 min
  completed: 2026-03-30
---

# Phase 01 Plan 04: Authentication Setup Summary

better-auth with email/password + magic link, Drizzle adapter, route protection middleware.

## What Was Built

### Auth Server (src/lib/auth.ts)
- better-auth configured with Drizzle PostgreSQL adapter
- Email/password provider with 8-char minimum password
- Magic link plugin using Resend for email delivery
- Session: 7-day expiry, 1-day refresh, 5-min cookie cache
- French-language magic link email template

### Auth Client (src/lib/auth-client.ts)
- createAuthClient with magicLinkClient plugin
- Typed exports: signIn, signUp, signOut, useSession, getSession

### API Route (src/app/api/auth/[...all]/route.ts)
- Catch-all route handler using toNextJsHandler
- Exports GET and POST for all auth endpoints

### Middleware (src/middleware.ts)
- Public routes: /, /login, /register, /api/auth
- Public prefixes: /m/* (guest RSVP), /api/og
- Protected prefixes: /dashboard/*, /match/*, /group/*, /player/*
- Redirects to /login with callbackUrl on unauthorized access

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unsupported experimental option**
- **Found during:** Task 2 verification
- **Issue:** `experimental.optimizeDatabaseQueries` not in better-auth 1.5.6 types
- **Fix:** Removed the experimental block entirely
- **Files modified:** src/lib/auth.ts

**2. [Rule 2 - Missing] Added /register to public routes**
- **Found during:** Task 4 implementation
- **Issue:** Plan only listed /login but registration needs to be public
- **Fix:** Added "/register" to publicRoutes array
- **Files modified:** src/middleware.ts

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 98f7e52 | feat | add better-auth with email/password and magic link |

## Verification

- [x] `pnpm typecheck` passes
- [x] Auth API route exports GET and POST
- [x] Middleware protects /dashboard/*
- [x] /m/* routes remain public for guest RSVP

## Known Stubs

None - all functionality wired.

## Self-Check: PASSED
