---
phase: 9
slug: recurrence-automation
status: draft
shadcn_initialized: true
preset: new-york (baseColor: neutral, cssVariables: true)
created: 2026-03-31
---

# Phase 9 — Recurrence & Automation UI Design Contract

> Visual and interaction contract for Phase 9 (Recurrence & Automation).
> **Note:** This is primarily a backend infrastructure phase. The main UI deliverables are email templates for recurring match notifications.

---

## Phase Scope

This phase focuses on backend automation (cron jobs, match creation logic). The only frontend-facing elements are:

1. **Recurrence field in match creation form** — ALREADY IMPLEMENTED (see src/components/match/match-form.tsx lines 269-278)
2. **Email template for recurring match notifications** — NEW, specified in this contract
3. **Cron status/debugging UI** — OPTIONAL, out of scope for MVP

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | new-york (baseColor: neutral, cssVariables: true, RSC: true) |
| Component library | Radix UI (via shadcn/ui) |
| Icon library | Lucide React (UI icons) + FootballIcon (domain concepts) |
| Font | DM Sans (body), Space Mono (data) |

**Source:** components.json, src/lib/design-tokens.ts

---

## Spacing Scale

Standard 8-point scale (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

**Exceptions:** none — use standard scale for email templates (responsive on mobile)

**Source:** CLAUDE.md design system conventions

---

## Typography

| Role | Size | Weight | Line Height | Font Family |
|------|------|--------|-------------|-------------|
| Body | 16px | 400 | 1.5 | DM Sans, sans-serif |
| Label | 14px | 600 | 1.4 | DM Sans, sans-serif |
| Heading | 24px | 700 | 1.2 | DM Sans, sans-serif |
| Display | 32px | 700 | 1.2 | DM Sans, sans-serif |

**Email template fallback:** Use system font stack for email client compatibility:
`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`

**Source:** src/lib/design-tokens.ts, src/app/globals.css

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #F8FAF5 (chalk) | Email background |
| Secondary (30%) | #FFFFFF (chalk-pure) | Card background, content areas |
| Accent (10%) | #2D5016 (pitch) | CTA button, header background |
| Destructive | #EF4444 (red-card) | Error messages (if needed) |

**Accent reserved for:**
- CTA button background ("Confirmer ma présence")
- Email header background
- Brand accent color in footer

**Source:** src/lib/design-tokens.ts, src/app/globals.css

---

## Copywriting Contract

### Recurring Match Notification Email

| Element | Copy |
|---------|------|
| Email subject | "Nouveau match : {matchTitle}" or "Match hebdomadaire" (if no title) |
| Preheader | "Confirme ta place pour le {date} à {location}" |
| Heading | "🏈 Nouveau match créé" |
| Body intro | "Un nouveau match a été créé pour ton groupe." |
| Match title | "{matchTitle}" or "Match hebdomadaire" (bold) |
| Location | "📍 {location}" (icon + text) |
| Date/time | "📅 {formattedDate} à {formattedTime}" (icon + text) |
| Primary CTA | "Confirmer ma présence" (button, links to /m/{shareToken}) |
| Secondary link | "Voir le match" (text link below button) |
| Footer | "Tu reçois cet email parce que tu es membre du groupe {groupName}. <br><a href='#'>Se désinscrire</a> du groupe." |

### Empty State (if no group members have emails)

| Element | Copy |
|---------|------|
| Log message | "No recipients with emails for group {groupId}" (dev-only) |

### Error States

| Element | Copy |
|---------|------|
| Cron failed | "Failed to create recurring match occurrence for parent {parentMatchId}: {error}" (log only) |
| Email send failed | "Failed to send notification for match {matchId}: {error}" (log only) |

**Source:** CONTEXT.md D-10, RESEARCH.md email template section

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | (none — email templates use inline HTML/CSS) | not required |
| (third-party) | (none) | N/A |

**Note:** Email templates use inline HTML/CSS for email client compatibility. No shadcn components are used in email templates.

---

## Email Template Specification

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau match : {matchTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAF5;">
  <div style="max-width: 400px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background-color: #2D5016; padding: 24px; border-radius: 16px 16px 0 0;">
      <h2 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700;">🏈 Nouveau match créé</h2>
    </div>

    <!-- Content -->
    <div style="background-color: #FFFFFF; padding: 24px; border-radius: 0 0 16px 16px;">
      <p style="color: #1E293B; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Un nouveau match a été créé pour ton groupe.
      </p>

      <h3 style="color: #2D5016; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">
        {matchTitle}
      </h3>

      <p style="color: #64748B; font-size: 14px; margin: 0 0 4px 0;">
        📍 {location}
      </p>

      <p style="color: #64748B; font-size: 14px; margin: 0 0 24px 0;">
        📅 {formattedDate} à {formattedTime}
      </p>

      <!-- CTA Button -->
      <a href="{matchUrl}"
         style="display: inline-block; background-color: #2D5016; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; text-align: center;">
        Confirmer ma présence
      </a>

      <!-- Secondary Link -->
      <div style="text-align: center; margin-top: 16px;">
        <a href="{matchUrl}" style="color: #2D5016; text-decoration: none; font-size: 14px;">
          Voir le match
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; padding: 16px;">
      <p style="color: #64748B; font-size: 12px; margin: 0;">
        Tu reçois cet email parce que tu es membre du groupe <strong>{groupName}</strong>.
      </p>
      <p style="color: #64748B; font-size: 12px; margin: 8px 0 0 0;">
        <a href="#" style="color: #64748B;">Se désinscrire</a> du groupe.
      </p>
    </div>
  </div>
</body>
</html>
```

### Responsive Behavior

- **Desktop:** Max-width 400px centered container
- **Mobile:** Full width with 20px padding
- **Button:** Full width on mobile (< 400px viewport), auto width on desktop

### Color Values (Inline for Email Clients)

| Role | Hex | Usage |
|------|-----|-------|
| Header background | #2D5016 | Top card with heading |
| Content background | #FFFFFF | Main content area |
| CTA button background | #2D5016 | Primary action button |
| CTA button text | #FFFFFF | Button text |
| Body background | #F8FAF5 | Outer container |
| Text primary | #1E293B | Headings, body text |
| Text secondary | #64748B | Meta info (date, location) |
| Footer text | #64748B | Disclaimer, unsubscribe |

### Typography Values (Inline)

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Heading (🏈) | 24px | 700 | 1.2 |
| Match title | 18px | 700 | 1.2 |
| Body text | 16px | 400 | 1.5 |
| Meta info (📍📅) | 14px | 400 | 1.4 |
| Footer text | 12px | 400 | 1.4 |

**Source:** CONTEXT.md D-10, RESEARCH.md Pattern 5

---

## Implementation Notes

### File Location

Email template function: `src/lib/utils/emails.ts`
```typescript
export async function sendRecurringMatchNotification(
  matchId: string,
  groupId: string
): Promise<void>
```

### Dependencies

- **Resend:** Already configured in `src/lib/auth.ts`
- **date-fns:** Use `format(date, 'PPP p', { locale: fr })` for French date formatting
- **getGroupMembers:** Query from `src/lib/db/queries/groups.ts` for recipient emails

### Email Sending Logic

1. Fetch match details via `getMatchById(matchId)`
2. Fetch group members via `getGroupMembers(groupId)`
3. Filter members with emails: `members.map(m => m.email).filter(Boolean)`
4. Send via `resend.emails.send()` with template above
5. Return early if no recipients (wastes Resend quota)

**Source:** RESEARCH.md Pattern 5, CONTEXT.md D-08 through D-10

---

## Existing UI Elements (Already Implemented)

### Recurrence Field in Match Creation Form

**Location:** `src/components/match/match-form.tsx` lines 269-278

**Implementation:**
```tsx
<Label htmlFor="recurrence">Récurrence</Label>
<select
  id="recurrence"
  {...register("recurrence")}
  className="h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
>
  <option value="none">One-shot</option>
  <option value="weekly">Hebdomadaire</option>
</select>
```

**Style:** shadcn/ui select component (native select with Tailwind styling)
- Height: 48px (h-12)
- Border radius: 6px (rounded-md)
- Colors: Uses shadcn input/select variables from globals.css
- Font: Base size (16px) for mobile touch-friendliness

**No changes required** — field is functional and matches design system.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## Appendix: Design Tokens Reference

### kickoff Brand Colors (for Email Template)

```typescript
// From src/lib/design-tokens.ts
pitch: "#2D5016"        // Vert terrain — primary brand color
lime: "#4ADE80"         // Accent — success, confirmations
chalk: "#F8FAF5"        // Background app
chalkPure: "#FFFFFF"    // Cards, elevated surfaces
slate: "#1E293B"        // Texte principal
slateMid: "#64748B"     // Texte secondaire
```

### Football Icons (Not Used in Email)

Email templates use standard emoji (🏈⚽📍📅) for maximum email client compatibility. FootballIcon component is NOT used in email templates.

**Source:** src/lib/design-tokens.ts, src/components/icons/football-icons.tsx

---

*Phase: 09-recurrence-automation*
*UI-SPEC created: 2026-03-31*
