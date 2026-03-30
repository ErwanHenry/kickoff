---
phase: 2
slug: match-creation-guest-rsvp
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `pnpm test -- --run` |
| **Full suite command** | `pnpm test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run`
- **After every plan wave:** Run `pnpm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | MATCH-01 | e2e | `pnpm test match-creation` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | MATCH-02 | unit | `pnpm test match-form-validation` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | GUEST-01, GUEST-02 | e2e | `pnpm test guest-rsvp-flow` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | GUEST-03 | unit | `pnpm test guest-token-cookie` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | GUEST-06, GUEST-07, WAIT-03 | unit | `pnpm test waitlist-logic` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | WAIT-01 | integration | `pnpm test waitlist-promotion` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | MATCH-07 | e2e | `pnpm test dashboard-view` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/match/__tests__/match-form.test.tsx` — stubs for MATCH-01, MATCH-02
- [ ] `src/components/match/__tests__/rsvp-button.test.tsx` — stubs for GUEST-01, GUEST-02
- [ ] `src/lib/__tests__/waitlist.test.ts` — stubs for WAIT-01, WAIT-03
- [ ] `src/app/__tests__/dashboard.test.tsx` — stubs for MATCH-07
- [ ] `vitest.config.ts` — verify configuration (exists from Phase 1)

**Note:** Wave 0 is optional — all tasks use grep/file checks for `<automated>` verification, no MISSING references present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cookie persistence across browser sessions | GUEST-03 | Requires browser restart and cookie inspection | 1. RSVP as guest 2. Close browser 3. Reopen /m/{token} 4. Verify "Salut [Prénom]" banner appears |
| localStorage fallback for Safari ITP | GUEST-03, CONTEXT D-17 | Requires Safari browser testing | 1. RSVP as guest in Safari 2. Verify localStorage set 3. Refresh page 4. Verify state restored from localStorage |
| WhatsApp link preview accuracy | SHARE-03 | Requires external WhatsApp link debugger | 1. Create match 2. Copy /m/{token} link 3. Paste in https://developers.facebook.com/tools/debug/ 4. Verify OG title, description, image |
| 3G connection load time <1s | SHARE-03 | Requires network throttling in DevTools | 1. Open Chrome DevTools 2. Enable "Fast 3G" throttling 3. Load /m/{token} 4. Check Network tab timing |
| Match status badge visibility | MATCH-05, MATCH-06 | Visual verification on mobile viewport | 1. Open match page on iPhone SE (375px) 2. Verify status badge color and text |
| Guest returning sees personalized welcome | GUEST-04 | Visual verification of UI state | 1. RSVP as guest "Thomas" 2. Refresh page 3. Verify "Salut Thomas ! Tu es confirmé" banner |
| Guest cancellation works | GUEST-05 | Functional verification of cancel flow | 1. RSVP as guest 2. Click "Me désinscrire" 3. Verify status changes to cancelled 4. Verify button returns to "Je suis là !" |
| Concurrent RSVP + cancellation handling | WAIT-03, WAIT-04 | Requires two browser windows | 1. Open two browsers 2. Simultaneously cancel and RSVP for last spot 3. Verify transaction handles correctly |
| Concurrent RSVP + promotion handling | WAIT-01 | Requires two browser windows | 1. Create match 9 confirmed, 1 waitlisted 2. Simultaneously cancel 1 confirmed AND RSVP 1 new 3. Verify final state correct |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (N/A — no MISSING references, Wave 0 optional)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] `wave_0_complete: true` set in frontmatter (Wave 0 optional since all tasks use grep/file checks)

**Approval:** pending
