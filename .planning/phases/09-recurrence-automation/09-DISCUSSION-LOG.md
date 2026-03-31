# Phase 9: Recurrence & Automation - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-03-31
**Phase:** 09-recurrence-automation
**Mode:** assumptions
**Areas analyzed:** Cron Infrastructure Pattern, Recurrence Logic & Date Calculation, Match Creation Inheritance Pattern, Email Notification Infrastructure, Cron Endpoint Security

## Assumptions Presented

### Cron Infrastructure Pattern
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Vercel Cron Jobs will be used for weekly match creation, configured in `vercel.json` with a `CRON_SECRET` environment variable for security | Confident | vercel.json exists, project uses Vercel hosting, no existing cron infrastructure |

### Recurrence Logic & Date Calculation
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Weekly recurrence will use `date-fns` (already installed per package.json) to calculate the next occurrence by adding 7 days to the parent match's date | Confident | date-fns in package.json (line 29), schema supports recurrence="weekly" and parentMatchId |

### Match Creation Inheritance Pattern
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| New weekly occurrences will inherit ALL parent match settings except `shareToken`, `status` (always "open"), and player data (no auto-confirmation per RECUR-04) | Confident | createMatch Server Action exists in src/app/api/matches/actions.ts, schema has parentMatchId self-reference |

### Email Notification Infrastructure
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Email notifications for new match occurrences will use the existing Resend instance from src/lib/auth.ts and query group members via `getGroupMembers` from src/lib/db/queries/groups.ts | Confident | Resend configured in auth.ts (lines 6-8), getGroupMembers exists (lines 255-269) |

### Cron Endpoint Security
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| The cron endpoint will be protected by comparing a `CRON_SECRET` header value against an environment variable, returning 401 if invalid | Confident | No existing CRON_SECRET found, standard security pattern, vercel.json has security headers |

## Corrections Made

No corrections — all assumptions confirmed.

## External Research

### Research Needed

1. **Vercel Cron Jobs syntax with Next.js 16** — Need to verify the exact `vercel.json` configuration format for cron jobs with Next.js 16.2.1 (current version in package.json). Vercel's documentation may have specific requirements for the `cron` key syntax.

2. **Cron schedule expression for weekly checks** — Need to determine the optimal cron expression (e.g., daily at midnight vs. weekly specific day) for checking recurring matches. The requirement says "weekly recurring match auto-creates next occurrence" but doesn't specify when the check should run.

3. **Resend rate limits for bulk emails** — Need to verify Resend's free tier (3K/month) is sufficient for group notifications. If a group has 20 members and creates weekly matches, that's 20 emails/week × 52 weeks = 1,040 emails/year just for one group. Multiple groups could exceed limits.

---

*Phase: 09-recurrence-automation*
*Discussion log: 2026-03-31*
