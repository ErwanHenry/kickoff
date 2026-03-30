---
phase: "01"
plan: "07"
subsystem: "ui"
tags:
  - landing
  - dashboard
  - pwa
  - install-prompt
dependency_graph:
  requires:
    - 01-05
    - 01-06
  provides:
    - landing-page
    - dashboard-placeholder
    - install-prompt
  affects:
    - user-onboarding
tech_stack:
  added:
    - lucide-react
  patterns:
    - beforeinstallprompt-api
    - ios-pwa-fallback
key_files:
  created:
    - src/app/page.tsx
    - src/components/install-prompt.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
decisions:
  - "D-07: Hero with problem/solution headline implemented"
  - "D-08: 3 feature icons (Inviter, Equilibrer, Noter) using lucide-react"
  - "D-09: Primary CTA 'C'est parti !' links to /login"
  - "D-10: Install prompt appears in dashboard layout after login"
metrics:
  duration: ~5min
  completed: "2026-03-30"
---

# Phase 01 Plan 07: Landing Page + Dashboard Summary

Landing page with hero, 3 feature icons, CTA to /login, and dashboard placeholder with PWA install prompt.

## One-liner

Mobile-first landing with "Fini le bordel sur WhatsApp" hero, 3 value prop icons (Inviter/Equilibrer/Noter), and dashboard shell with beforeinstallprompt PWA install component.

## What Was Built

### Landing Page (src/app/page.tsx)
- Hero section with "kickoff" title and problem/solution headline (D-07)
- 3 feature cards with lucide-react icons: Send (Inviter), Scale (Equilibrer), Star (Noter) (D-08)
- Primary CTA "C'est parti !" linking to /login (D-09)
- Footer with app tagline

### Install Prompt Component (src/components/install-prompt.tsx)
- Listens for beforeinstallprompt event for Android/Chrome PWA install
- iOS fallback with manual instructions ("Partager" > "Sur l'ecran d'accueil")
- Dismissable with localStorage persistence
- Detects standalone mode to hide when already installed

### Dashboard Layout (src/app/(dashboard)/layout.tsx)
- Sticky header with "kickoff" branding
- InstallPrompt component rendered after login (D-10)
- Container layout for dashboard content

### Dashboard Page (src/app/(dashboard)/page.tsx)
- Welcome message and placeholder content
- "Creer un match" CTA (links to future Phase 2 route)
- Roadmap showing upcoming phases

## Technical Decisions

1. **Used lucide-react icons** instead of emoji for consistent styling and better accessibility
2. **Direct Link styling** instead of Button asChild (base-ui Button doesn't support asChild prop)
3. **localStorage for dismiss state** - simple persistence without backend
4. **iOS detection via userAgent** - standard pattern for Safari PWA instructions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Button asChild prop not supported**
- **Found during:** Task 1 verification
- **Issue:** The shadcn/ui Button component uses base-ui which doesn't have asChild prop
- **Fix:** Used styled Link components directly instead of Button asChild pattern
- **Files modified:** src/app/page.tsx, src/app/(dashboard)/page.tsx
- **Commit:** abda537

## Verification

- `pnpm typecheck` - PASSED
- Landing page displays hero, features, CTA - VERIFIED
- /login accessible from CTA - VERIFIED (link present)
- Dashboard shows placeholder with install prompt - VERIFIED

## Self-Check: PASSED

- [x] src/app/page.tsx exists (78 lines)
- [x] src/components/install-prompt.tsx exists (contains beforeinstallprompt)
- [x] src/app/(dashboard)/layout.tsx exists (contains InstallPrompt)
- [x] src/app/(dashboard)/page.tsx exists
- [x] Commit abda537 exists
