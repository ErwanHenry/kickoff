---
phase: 10
slug: polish-production
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test --run && pnpm typecheck && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SHARE-01 | unit | `pnpm test og.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | SHARE-02 | unit | `pnpm test og.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 2 | NOTIF-01 | unit | `pnpm test emails.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 2 | NOTIF-02 | unit | `pnpm test emails.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-03 | 02 | 2 | NOTIF-03 | unit | `pnpm test emails.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-04 | 02 | 2 | NOTIF-04 | unit | `pnpm test emails.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-05 | 02 | 2 | NOTIF-05 | unit | `pnpm test emails.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 3 | AUTH-05 | unit | `pnpm test merge.test.ts` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 4 | NOTIF (all) | manual | WhatsApp preview test | — | ⬜ pending |
| 10-05-01 | 05 | 5 | NOTIF (all) | manual | Device testing | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/unit/og.test.ts` — OG image generation tests (match data, truncation, fallbacks)
- [ ] `src/lib/__tests__/unit/emails.test.ts` — Email template tests (waitlist promo, deadline reminder, rating, welcome)
- [ ] `src/lib/__tests__/unit/merge.test.ts` — Guest merge tests (match_players update, ratings update, stats recalculation)
- [ ] `src/lib/__tests__/fixtures/match.ts` — Match fixtures for OG and email tests
- [ ] `src/lib/__tests__/fixtures/user.ts` — User fixtures for merge tests

*Vitest config already exists at project root.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OG image preview on WhatsApp | SHARE-01, SHARE-02 | WhatsApp has no API for automated preview testing | 1. Create match with seed data. 2. Copy share link /m/{token}. 3. Send to WhatsApp chat. 4. Verify preview displays: title, 8/14 confirmés badge, location, date/time. 5. Test with long location name (30+ chars) — verify truncation. 6. Test with no title — verify fallback "Match du [date]" |
| Email delivery to inbox | NOTIF-01 through NOTIF-05 | Email deliverability requires real SMTP validation | 1. Configure test email recipient. 2. Trigger waitlist promotion via API. 3. Verify email arrives within 30s. 4. Check spam folder. 5. Repeat for deadline reminder, post-match rating, welcome email |
| Guest merge preserves history | AUTH-05 | End-to-end flow spans multiple systems | 1. Create guest via RSVP. 2. Play match and rate. 3. Create account from guest link. 4. Verify profile shows all match history and ratings |
| PWA installable on mobile | PWA-01 through PWA-04 | Requires real mobile browsers | 1. Open app on iPhone. 2. Verify "Add to Home Screen" prompt appears. 3. Install and verify launch from home screen |
| Responsive on iPhone SE (375px) | All | Mobile viewport testing | 1. Open DevTools to 375px width. 2. Navigate all pages. 3. Verify no horizontal scroll, all text readable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
