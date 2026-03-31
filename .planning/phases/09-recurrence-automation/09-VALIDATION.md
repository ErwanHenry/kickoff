---
phase: 9
slug: recurrence-automation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test src/lib/__tests__/unit/recurrence.test.ts`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | RECUR-01 | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | RECUR-02 | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | RECUR-03 | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | RECUR-04 | unit | `pnpm test src/lib/__tests__/unit/recurrence.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 2 | MATCH-03 | integration | Manual test in match form | ✅ Already implemented | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — stubs for RECUR-01 through RECUR-04
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — test `addWeeks()` date calculation edge cases (DST, leap year)
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — test CRON_SECRET validation logic
- [ ] `src/lib/__tests__/unit/recurrence.test.ts` — test duplicate occurrence prevention
- [ ] Framework install: Already configured (vitest, @vitejs/plugin-react, jsdom)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recurrence field in match creation form | MATCH-03 | UI interaction | 1. Navigate to /matches/new, 2. Verify "Récurrence" dropdown exists with options "Unique" and "Hebdomadaire", 3. Select "Hebdomadaire" and create match, 4. Verify database has recurrence="weekly" |
| Cron job execution on Vercel | RECUR-01 | Infrastructure | 1. Deploy to Vercel, 2. Wait for cron schedule (midnight UTC), 3. Check Vercel function logs, 4. Verify recurring match created in database |
| Email notification received | RECUR-03 | External service | 1. Create recurring match with group, 2. Wait for cron execution, 3. Check email inbox, 4. Verify notification received with correct match details |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
