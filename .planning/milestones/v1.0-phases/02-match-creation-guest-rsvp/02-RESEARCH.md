# Phase 2: Match Creation & Guest RSVP - Research

**Researched:** 2026-03-30
**Domain:** Match CRUD operations, public RSVP flow, guest authentication via cookies
**Confidence:** MEDIUM

## Summary

This phase delivers the core differentiating feature: zero-friction guest RSVP via shareable WhatsApp links. Organizers create matches with configurable parameters, and guests can RSVP using only their first name (no account required). The system manages match status transitions (draft → open → full → locked), handles waitlist logic with automatic promotions, and maintains guest identity via httpOnly cookies.

**Key technical challenge:** Implementing secure guest authentication without traditional sessions. Guests need persistent identity across visits (for cancel RSVP, return visits) without creating accounts. The solution uses dual storage: httpOnly cookies for security and localStorage for UI state.

**Primary recommendation:** Use Next.js 15 Server Actions for form submissions (match creation, RSVP) rather than API routes. Server Actions provide better TypeScript integration, automatic CSRF protection, and progressive enhancement. Reserve API routes for truly public endpoints (like the public match page accessed via shareToken).

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Match Creation Form
- **D-01:** Card sections layout — Fields grouped in collapsible/expandable cards: "Quand ?", "Où ?", "Combien ?", "Options"
- **D-02:** Date/time picker — Native `<input type='datetime-local'>` for simplicity and mobile compatibility
- **D-03:** Location input — Autocomplete suggestions that suggests common venues as user types
- **D-04:** Player limits — Both max_players AND min_players as separate number inputs (not presets)
- **D-05:** Recurrence — Advanced picker with options for weekly, bi-weekly, and custom schedules
- **D-06:** Confirmation deadline — Required field with smart default (2h before match), user can override
- **D-07:** Group association — Optional autocomplete field; leave empty for standalone matches
- **D-08:** Draft + publish workflow — Match starts in "draft" state, creator clicks "Publier" to make it "open" and generate shareable link

#### Public Match Page
- **D-09:** Top information — Essentials only: match title (or "Match du [date]"), date + time, location, player count
- **D-10:** Player count display — Full display: X/Y count + circular progress ring + status badge
- **D-11:** Confirmed players list — Show all confirmed players with names and avatars (scrollable if many)
- **D-12:** Waitlist display — Count only: "3 en liste d'attente" (no individual names shown publicly)
- **D-13:** Empty match state — Encouraging message: "Soyez le premier à confirmer !"
- **D-14:** Full match behavior — Hide RSVP button, show "Complet" badge, show waitlist count

#### Guest RSVP Flow
- **D-15:** Name input — "Ton prénom ou surnom" (casual, matches user preference pattern from Phase 1)
- **D-16:** RSVP button behavior — State text progression: "Je suis là !" → "Confirmé ✓" → "Me désinscrire"
- **D-17:** Guest token storage — Both approaches: httpOnly cookie for auth/security + localStorage for UI state (name display, welcome message)
- **D-18:** Return visit experience — Personalized welcome banner: "Salut [Prénom] ! Tu es confirmé pour ce match"

#### Match Status Flow
- **D-19:** Status badge visibility — Always visible colored badge on match cards: "Ouvert" (green), "Complet" (red), "Verrouillé" (gray)
- **D-20:** Match status transitions — Claude's discretion — implement technically sound flow (likely: draft → open → full → locked → played → rated based on schema)

### Claude's Discretion
- Match status flow implementation — choose the most technically sound approach based on database schema and API design

### Deferred Ideas (OUT OF SCOPE)
- Calendar sync (CAL-01, CAL-02) — Noted as out of scope in REQUIREMENTS.md, belongs to v2/future phase

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MATCH-01 | Organizer can create match with date, time, location, max/min players | Zod validation, Server Actions pattern |
| MATCH-02 | Organizer can set optional confirmation deadline | Native datetime-local input, 2h default |
| MATCH-04 | Match generates unique shareable link (/m/{shareToken}) | nanoid(10) for share tokens, dynamic route |
| MATCH-05 | Match status progresses: draft → open → full → locked → played → rated | Database enum with state transition logic |
| MATCH-06 | Match displays confirmed count vs max (e.g., "8/14 confirmés") | Count query with progress visualization |
| MATCH-07 | Organizer can view dashboard with upcoming and recent matches | Server Component with data fetching |
| GUEST-01 | Guest can view match page via shareable link without account | Public route, Server Component for OG tags |
| GUEST-02 | Guest can RSVP by entering first name only | Form with single input, guest token creation |
| GUEST-03 | Guest receives cookie/token for persistent identity (30 days) | httpOnly cookie + localStorage dual storage |
| GUEST-04 | Guest returning to match page sees their RSVP status | Cookie-based lookup on page load |
| GUEST-05 | Guest can cancel their RSVP via same link | PATCH action, status transition to cancelled |
| GUEST-06 | Guest automatically waitlisted when match is full | Status check before confirmation |
| GUEST-07 | Guest waitlisted sees their position in queue | Position calculation query |
| WAIT-03 | Match status changes from full → open when spot available | Status transition on cancellation |
| WAIT-04 | Match status returns to full when max players reached again | Status transition on RSVP |
| SHARE-03 | Match page loads in <1s on 3G connection | SSR, minimal JS, optimized images |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Next.js** | 16.2.1 (latest) | React framework with App Router | Server Components for OG tags, Server Actions for forms |
| **React** | 19.2.4 | UI library | Concurrent features for smooth UI updates |
| **TypeScript** | 5.x | Type safety | Strict mode, prevents runtime errors |
| **Drizzle ORM** | 0.45.2 | Database queries | Type-safe query builders, excellent pg support |
| **Neon Serverless** | 1.0.2 | PostgreSQL hosting | Auto-scaling, HTTP-based (no pooling) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **better-auth** | 1.5.6 | User authentication | Already configured, use for user sessions |
| **react-hook-form** | 7.72.0 | Form performance | Large forms (match creation with many fields) |
| **zod** | 4.3.6 | Schema validation | Input validation, type inference |
| **nanoid** | 5.1.7 | Unique IDs | Share tokens (10 chars), guest tokens |
| **sonner** | 2.0.7 | Toast notifications | User feedback, shadcn/ui compatible |
| **shadcn/ui** | latest | Component library | button, input, card, badge, avatar, dialog |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | API Routes | Server Actions: better TypeScript, CSRF protection. API Routes: more flexible for public endpoints |
| httpOnly cookie | localStorage only | httpOnly: secure (XSS protection). localStorage only: accessible to JS, less secure |
| Drizzle query builders | Raw SQL | Query builders: type-safe, composable. Raw SQL: more control, less safety |

**Installation:**
```bash
# Already installed from Phase 1
pnpm install nanoid  # For share tokens and guest tokens
```

**Version verification:**
- Next.js: 16.2.1 ✓ (latest, using 16.x branch)
- React: 19.2.4 ✓
- Drizzle: 0.45.2 ✓ (latest)
- better-auth: 1.5.6 ✓ (latest)
- zod: 4.3.6 ✓ (latest)
- nanoid: 5.1.7 ✓ (needs installation)
- @vercel/og: 0.11.1 ✓ (for Phase 6, not this phase)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                      # Dashboard organizer
│   │   └── matches/
│   │       └── new/
│   │           └── page.tsx              # Match creation form
│   ├── m/
│   │   └── [shareToken]/
│   │       └── page.tsx                  # Public match page (RSVP)
│   ├── api/
│   │   ├── matches/
│   │   │   └── route.ts                  # POST create, GET list
│   │   ├── rsvp/
│   │   │   └── route.ts                  # POST RSVP, PATCH cancel
│   │   └── matches/
│   │       └── [id]/
│   │           └── route.ts              # GET single match
│   └── layout.tsx
├── components/
│   ├── match/
│   │   ├── match-form.tsx                # Client component, react-hook-form
│   │   ├── rsvp-button.tsx               # Client component, state machine
│   │   ├── player-list.tsx               # Server component
│   │   └── match-card.tsx                # Server component
│   └── ui/                               # shadcn/ui components
├── lib/
│   ├── validations/
│   │   └── match.ts                      # Zod schemas
│   └── cookies.ts                        # Cookie utilities
└── db/
    └── queries/
        └── matches.ts                    # Match query builders
```

### Pattern 1: Server Actions for Mutations
**What:** Server Actions eliminate the need for manual API routes for form submissions
**When to use:** Form submissions (create match, RSVP, cancel), database mutations
**Example:**
```typescript
// src/app/api/matches/route.ts
"use server"

import { z } from "zod"
import { nanoid } from "nanoid"
import { db } from "@/db"
import { matches } from "@/db/schema"
import { matchCreateSchema } from "@/lib/validations/match"
import { auth } from "@/lib/auth"

export async function createMatch(input: z.infer<typeof matchCreateSchema>) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return { error: "Non authentifié" }
  }

  const validated = matchCreateSchema.parse(input)

  const shareToken = nanoid(10)

  const [match] = await db.insert(matches).values({
    ...validated,
    shareToken,
    createdBy: session.user.id,
    status: "draft"
  }).returning()

  revalidatePath("/dashboard")
  redirect(`/match/${match.id}`)
}
```

### Pattern 2: Public Route with Server Component
**What:** Server Components render on server, perfect for OG tags and initial page load
**When to use:** Public pages that need SSR (match page via shareToken)
**Example:**
```typescript
// src/app/m/[shareToken]/page.tsx
import { notFound } from "next/navigation"
import { db } from "@/db"
import { matches, matchPlayers } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

interface PageProps {
  params: { shareToken: string }
}

export async function generateMetadata({ params }: PageProps) {
  const match = await getMatchByShareToken(params.shareToken)

  if (!match) {
    return { title: "Match non trouvé | kickoff" }
  }

  const confirmedCount = await getConfirmedCount(match.id)

  return {
    title: `${match.title || `Match du ${match.date}`} — kickoff`,
    description: `⚽ ${confirmedCount}/${match.maxPlayers} joueurs • 📍 ${match.location} • 📅 ${match.date}`,
    openGraph: {
      title: match.title || `Match du ${match.date}`,
      description: `${confirmedCount}/${match.maxPlayers} confirmés`,
    },
  }
}

export default async function PublicMatchPage({ params }: PageProps) {
  const match = await getMatchByShareToken(params.shareToken)

  if (!match) {
    notFound()
  }

  const players = await getMatchPlayers(match.id)

  return (
    <main className="min-h-screen bg-background">
      {/* Server-rendered content */}
      <RSVPButton matchId={match.id} shareToken={params.shareToken} />
    </main>
  )
}
```

### Pattern 3: Guest Token Cookie Management
**What:** Dual storage approach for guest identity persistence
**When to use:** Guest RSVP, guest return visits, guest cancellation
**Example:**
```typescript
// src/lib/cookies.ts
import { cookies } from "next/headers"

const GUEST_COOKIE_NAME = "kickoff_guest_token"

export async function setGuestToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })
}

export async function getGuestToken() {
  const cookieStore = await cookies()
  return cookieStore.get(GUEST_COOKIE_NAME)?.value
}

export async function deleteGuestToken() {
  const cookieStore = await cookies()
  cookieStore.delete(GUEST_COOKIE_NAME)
}
```

### Anti-Patterns to Avoid
- **Client-side data fetching for initial page load:** Server Components are faster and better for SEO
- **localStorage for sensitive data:** Never store tokens in localStorage alone (XSS vulnerability)
- **API routes when Server Actions suffice:** Server Actions are simpler for form submissions
- **Manual CSRF handling:** Server Actions handle this automatically
- **Mixed authentication patterns:** Stick to better-auth for users, cookie-based for guests

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod + react-hook-form | Type-safe, schema-as-code, excellent error messages |
| Unique ID generation | Random string generator | nanoid(10) | URL-safe, collision-resistant, industry standard |
| Cookie management | Manual cookie parsing | `next/headers` cookies() | Built-in, type-safe, handles edge cases |
| Toast notifications | Custom notification system | Sonner (shadcn/ui) | Accessible, mobile-friendly, proven |
| Form state management | Custom useState hooks | react-hook-form | Performance optimization, minimal re-renders |
| Date formatting | Manual date logic | date-fns | Lightweight, tree-shakeable, i18n support |
| Query building | Raw SQL strings | Drizzle query builders | Type-safe, composable, prevents SQL injection |

**Key insight:** Every problem in this phase has a well-tested library solution. Custom implementations add maintenance burden and security risks.

## Common Pitfalls

### Pitfall 1: Race Conditions in RSVP
**What goes wrong:** Two guests RSVP simultaneously when only one spot remains. Both succeed, exceeding max_players.
**Why it happens:** Database read and write are not atomic. Check-then-act pattern has a race condition window.
**How to avoid:** Use database transactions with SELECT FOR UPDATE or Drizzle's transaction wrapper:
```typescript
import { db } from "@/db"
import { matches, matchPlayers } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function rsvpMatch(matchId: string, guestName: string) {
  return db.transaction(async (tx) => {
    // Lock the row for this transaction
    const [match] = await tx.select().from(matches)
      .where(eq(matches.id, matchId))
      .for("update")

    const confirmedCount = await tx.select({ count: sql<number>`count(*)` })
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, matchId))
      .where(eq(matchPlayers.status, "confirmed"))

    if (confirmedCount[0].count >= match.maxPlayers) {
      // Add to waitlist
      const [player] = await tx.insert(matchPlayers).values({
        matchId,
        guestName,
        status: "waitlisted",
        guestToken: nanoid(10),
      }).returning()

      return { player, position: confirmedCount[0].count - match.maxPlayers + 1 }
    }

    // Add to confirmed
    const [player] = await tx.insert(matchPlayers).values({
      matchId,
      guestName,
      status: "confirmed",
      guestToken: nanoid(10),
    }).returning()

    // Update match status if full
    if (confirmedCount[0].count + 1 === match.maxPlayers) {
      await tx.update(matches)
        .set({ status: "full" })
        .where(eq(matches.id, matchId))
    }

    return { player, position: null }
  })
}
```
**Warning signs:** Occasionally seeing "Complet" badge with more players than max, or waitlisted players getting confirmed when no spots opened.

### Pitfall 2: Cookie Not Set on Safari ITP
**What goes wrong:** Guest RSVP succeeds, but returning to the page shows "ton prénom" input again instead of "Confirmé ✓"
**Why it happens:** Safari's Intelligent Tracking Prevention (ITP) blocks cookies with 30-day expiration from third-party contexts.
**How to avoid:**
1. Use shorter expiration (7 days instead of 30)
2. Implement localStorage fallback for UI state
3. Add "SameSite=Lax" attribute
4. Detect cookie failure and warn user:
```typescript
// In RSVP action, after setting cookie
export async function rsvpMatch(matchId: string, guestName: string) {
  // ... RSVP logic ...

  const guestToken = nanoid(10)
  await setGuestToken(guestToken)

  // Return token to client for localStorage backup
  return { success: true, guestToken }
}

// In client component
"use client"
import { useEffect } from "react"

export function RSVPButton({ matchId }) {
  useEffect(() => {
    // Check if cookie was set
    const checkCookie = async () => {
      const response = await fetch("/api/auth/check-guest")
      if (!response.ok) {
        // Cookie not set, use localStorage
        localStorage.setItem("guest_token", guestToken)
      }
    }
    checkCookie()
  }, [guestToken])
}
```
**Warning signs:** Users report having to re-enter name on every visit, especially on iOS Safari.

### Pitfall 3: Share Token Collision
**What goes wrong:** Two matches get the same shareToken, causing one to be inaccessible
**Why it happens:** Using random() instead of cryptographically secure ID generator, or too short length
**How to avoid:** Use nanoid(10) which provides ~1.5 billion combinations with URL-safe characters:
```typescript
import { nanoid } from "nanoid"

const shareToken = nanoid(10) // 10 chars = ~1.5B combinations
```
**Warning signs:** 404 errors on valid-looking share links, or seeing wrong match data.

### Pitfall 4: Server Component Re-render Loop
**What goes wrong:** Page infinitely re-renders, causing CPU spike and database exhaustion
**Why it happens:** Calling Server Action from Server Component during render, or missing dependency in revalidatePath
**How to avoid:**
1. Never call Server Actions during render
2. Use "use client" directive for interactive components
3. Always revalidatePath after mutations
```typescript
// ❌ WRONG - Server Component calling action during render
export default function MatchPage({ shareToken }) {
  const match = getMatch(shareToken) // Runs on every render
  return <div>{match.title}</div>
}

// ✅ RIGHT - Server Component fetches once
export default async function MatchPage({ shareToken }) {
  const match = await getMatch(shareToken) // Runs once on server
  return <div>{match.title}</div>
}

// ✅ RIGHT - Client Component calls action on event
"use client"
export function RSVPButton() {
  const handleClick = async () => {
    await rsvpMatch(matchId, name) // Called on user action
  }
  return <button onClick={handleClick}>RSVP</button>
}
```
**Warning signs:** Browser console shows "Too many re-renders", DevTools Network tab shows continuous requests.

### Pitfall 5: Mobile Viewport Keyboard Overlap
**What goes wrong:** On mobile, when keyboard opens for "Ton prénom" input, the RSVP button scrolls out of view
**Why it happens:** Fixed positioning without accounting for mobile keyboard viewport changes
**How to avoid:** Use relative positioning or dynamic viewport units:
```css
/* ❌ WRONG */
.rsvp-container {
  position: fixed;
  bottom: 0;
  height: 100vh; /* Doesn't account for keyboard */
}

/* ✅ RIGHT */
.rsvp-container {
  position: fixed;
  bottom: 0;
  max-height: 100dvh; /* Dynamic viewport height */
  padding: env(safe-area-inset-bottom);
}

/* Or use sticky positioning */
.rsvp-button {
  position: sticky;
  bottom: env(safe-area-inset-bottom);
}
```
**Warning signs:** Users complain "can't tap RSVP button" on mobile, or button is half-hidden.

## Code Examples

### Creating a Match with Validation
```typescript
// src/lib/validations/match.ts
import { z } from "zod"

export const matchCreateSchema = z.object({
  title: z.string().max(100).optional(),
  location: z.string().min(1).max(200),
  date: z.coerce.date(), // "2024-04-15T20:00"
  maxPlayers: z.number().min(6).max(22).default(14),
  minPlayers: z.number().min(4).max(20).default(10),
  deadline: z.coerce.date().optional(),
  recurrence: z.enum(["none", "weekly"]).default("none"),
  groupId: z.string().uuid().optional(),
}).refine(
  (data) => data.minPlayers <= data.maxPlayers,
  { message: "minPlayers must be <= maxPlayers" }
).refine(
  (data) => !data.deadline || data.deadline < data.date,
  { message: "Deadline must be before match date" }
)

export type MatchCreateInput = z.infer<typeof matchCreateSchema>
```

### RSVP with Guest Token Creation
```typescript
// src/app/api/rsvp/route.ts
"use server"

import { z } from "zod"
import { nanoid } from "nanoid"
import { db } from "@/db"
import { matches, matchPlayers } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { setGuestToken } from "@/lib/cookies"
import { revalidatePath } from "next/cache"

const rsvpSchema = z.object({
  shareToken: z.string().length(10),
  guestName: z.string().min(1).max(50),
})

export async function rsvpMatch(formData: FormData) {
  const input = rsvpSchema.parse({
    shareToken: formData.get("shareToken"),
    guestName: formData.get("guestName"),
  })

  const guestToken = nanoid(10)

  const [match] = await db.select().from(matches)
    .where(eq(matches.shareToken, input.shareToken))
    .limit(1)

  if (!match) {
    return { error: "Match non trouvé" }
  }

  if (match.status === "locked" || match.status === "played" || match.status === "rated") {
    return { error: "Ce match est verrouillé" }
  }

  const result = await db.transaction(async (tx) => {
    const [currentCount] = await tx.select({ count: sql<number>`count(*)` })
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, match.id))
      .where(eq(matchPlayers.status, "confirmed"))

    const isFull = currentCount.count >= match.maxPlayers

    const status = isFull ? "waitlisted" : "confirmed"

    const [player] = await tx.insert(matchPlayers).values({
      matchId: match.id,
      guestName: input.guestName,
      guestToken,
      status,
    }).returning()

    if (isFull) {
      // Calculate waitlist position
      const [position] = await tx.select({ count: sql<number>`count(*)` })
        .from(matchPlayers)
        .where(eq(matchPlayers.matchId, match.id))
        .where(eq(matchPlayers.status, "waitlisted"))

      return { player, waitlistPosition: position.count }
    }

    // Update match status if now full
    if (currentCount.count + 1 >= match.maxPlayers) {
      await tx.update(matches)
        .set({ status: "full" })
        .where(eq(matches.id, match.id))
    }

    return { player, waitlistPosition: null }
  })

  await setGuestToken(guestToken)
  revalidatePath(`/m/${input.shareToken}`)

  return {
    success: true,
    guestToken,
    status: result.player.status,
    waitlistPosition: result.waitlistPosition,
  }
}
```

### Public Match Page with Guest Detection
```typescript
// src/app/m/[shareToken]/page.tsx
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/db"
import { matches, matchPlayers } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { MatchHeader } from "@/components/match/match-header"
import { PlayerList } from "@/components/match/player-list"
import { RSVPButton } from "@/components/match/rsvp-button"

interface PageProps {
  params: { shareToken: string }
}

async function getMatchData(shareToken: string) {
  const [match] = await db.select().from(matches)
    .where(eq(matches.shareToken, shareToken))
    .limit(1)

  if (!match) return null

  const players = await db.select({
    id: matchPlayers.id,
    name: matchPlayers.guestName,
    status: matchPlayers.status,
    confirmedAt: matchPlayers.confirmedAt,
  })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, match.id))
    .where(eq(matchPlayers.status, "confirmed"))
    .orderBy(desc(matchPlayers.confirmedAt))

  const [waitlistCount] = await db.select({ count: sql<number>`count(*)` })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, match.id))
    .where(eq(matchPlayers.status, "waitlisted"))

  return { match, players, waitlistCount: waitlistCount.count }
}

export async function generateMetadata({ params }: PageProps) {
  const data = await getMatchData(params.shareToken)

  if (!data) {
    return { title: "Match non trouvé | kickoff" }
  }

  const { match, players } = data

  return {
    title: `${match.title || "Match"} — kickoff`,
    description: `${players.length}/${match.maxPlayers} confirmés • ${match.location}`,
    openGraph: {
      title: match.title || "Match",
      description: `${players.length}/${match.maxPlayers} joueurs • ${match.location}`,
    },
  }
}

export default async function PublicMatchPage({ params }: PageProps }) {
  const data = await getMatchData(params.shareToken)

  if (!data) {
    notFound()
  }

  const { match, players, waitlistCount } = data

  const cookieStore = await cookies()
  const guestToken = cookieStore.get("kickoff_guest_token")?.value

  // Check if this guest has already RSVP'd
  const existingPlayer = players.find(p => p.id === guestToken)

  return (
    <main className="min-h-screen bg-background">
      <MatchHeader
        title={match.title}
        date={match.date}
        location={match.location}
      />

      <div className="px-4 py-6 space-y-6">
        <PlayerList
          players={players}
          confirmed={players.length}
          max={match.maxPlayers}
          waitlistCount={waitlistCount}
        />

        <RSVPButton
          matchId={match.id}
          shareToken={params.shareToken}
          isFull={players.length >= match.maxPlayers}
          existingPlayer={existingPlayer}
          guestToken={guestToken}
        />
      </div>
    </main>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for all mutations | Server Actions for forms | Next.js 14+ | Less boilerplate, better TypeScript, automatic CSRF |
| localStorage for everything | httpOnly cookies for auth, localStorage for UI | 2018+ (GDPR) | Better security, Safari ITP compliance |
| Manual form state | react-hook-form | 2019+ | Performance optimization, less re-rendering |
| Raw SQL validation | Zod schema validation | 2021+ | Type safety, single source of truth |

**Deprecated/outdated:**
- Next.js Pages Router: Use App Router (Server Components)
- Class components: Use functional components with hooks
- `getServerSideProps`: Use Server Components or Server Actions
- localStorage for auth tokens: Use httpOnly cookies
- Manual form validation: Use Zod + react-hook-form

## Open Questions

1. **Match Status Transition Logic**
   - What we know: Database has enum (draft, open, full, locked, played, rated)
   - What's unclear: Exact conditions for each transition (e.g., does draft→open happen automatically or manual "Publier"?)
   - Recommendation: Implement state machine in service layer with validation at each transition

2. **Location Autocomplete Data Source**
   - What we know: Decision D-03 wants autocomplete suggestions for common venues
   - What's unclear: Should this be a static list or external API (Google Places)?
   - Recommendation: Start with static list of 20 common French venues (UrbanSoccer, Le Five), external API in v2

3. **Waitlist Email Notification Timing**
   - What we know: Requirement WAIT-02 says promoted players receive email
   - What's unclear: Is this immediate or queued (Resend rate limits)?
   - Recommendation: Immediate for MVP, add queue if rate limits hit (Resend free tier: 3K/month)

4. **Guest Token Collision Detection**
   - What we know: nanoid(10) has ~1.5B combinations, collision probability is near-zero
   - What's unclear: Should we add unique constraint enforcement at database level?
   - Recommendation: Yes, add unique index on guest_token column for safety

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js | Framework | ✓ | 16.2.1 | — |
| React | UI library | ✓ | 19.2.4 | — |
| Drizzle ORM | Database | ✓ | 0.45.2 | — |
| Neon Serverless | Database hosting | ✓ | 1.0.2 | — |
| better-auth | Auth | ✓ | 1.5.6 | — |
| zod | Validation | ✓ | 4.3.6 | — |
| react-hook-form | Forms | ✓ | 7.72.0 | — |
| nanoid | IDs | ✗ | — | crypto.randomUUID() (less ideal) |
| sonner | Toasts | ✓ | 2.0.7 | — |
| shadcn/ui | Components | ✓ | latest | — |
| @vercel/og | OG images | ✓ | 0.11.1 | — (Phase 6) |

**Missing dependencies with no fallback:**
- None — all critical dependencies available

**Missing dependencies with fallback:**
- nanoid: Can use `crypto.randomUUID()` but it's longer (36 chars vs 10) and not URL-safe by default. Recommend installing nanoid.

**Recommended install:**
```bash
pnpm add nanoid
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (needs creation) |
| Quick run command | `pnpm test -- --run` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATCH-01 | Create match with valid data | unit | `pnpm test src/lib/validations/match.test.ts` | ❌ Wave 0 |
| MATCH-02 | Set optional deadline | unit | `pnpm test src/lib/validations/match.test.ts` | ❌ Wave 0 |
| MATCH-04 | Generate unique shareToken | unit | `pnpm test src/lib/utils/nanoid.test.ts` | ❌ Wave 0 |
| MATCH-05 | Status transitions correctly | unit | `pnpm test src/lib/services/match-status.test.ts` | ❌ Wave 0 |
| MATCH-06 | Display confirmed count | integration | `pnpm test src/app/m/[shareToken]/page.test.tsx` | ❌ Wave 0 |
| GUEST-02 | RSVP with first name only | integration | `pnpm test src/app/api/rsvp/route.test.ts` | ❌ Wave 0 |
| GUEST-03 | Cookie set for 30 days | unit | `pnpm test src/lib/cookies.test.ts` | ❌ Wave 0 |
| GUEST-06 | Auto-waitlist when full | integration | `pnpm test src/app/api/rsvp/route.test.ts` | ❌ Wave 0 |
| WAIT-03 | Status full → open on cancel | unit | `pnpm test src/lib/services/match-status.test.ts` | ❌ Wave 0 |
| SHARE-03 | Page load <1s on 3G | manual | Lighthouse CI (not automated) | — |

### Sampling Rate
- **Per task commit:** `pnpm test -- --run` (quick unit tests)
- **Per wave merge:** `pnpm test` (full suite including integration)
- **Phase gate:** Full suite green + manual Lighthouse test for SHARE-03

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `src/lib/validations/match.test.ts` — Match form validation tests
- [ ] `src/lib/cookies.test.ts` — Cookie management tests
- [ ] `src/lib/services/match-status.test.ts` — Status transition logic tests
- [ ] `src/app/api/rsvp/route.test.ts` — RSVP API tests (including race conditions)
- [ ] `src/app/m/[shareToken]/page.test.tsx` — Public match page tests

## Sources

### Primary (HIGH confidence)
- Next.js 15/16 documentation — Server Actions, Server Components, App Router (official docs, training data)
- Drizzle ORM documentation — Query builders, transactions (official docs, training data)
- better-auth documentation (v1.5.6) — Session management, Drizzle adapter (official docs)
- Zod v4.3.6 documentation — Schema validation, type inference (official docs, training data)
- react-hook-form v7.72.0 documentation — Form state management (official docs, training data)
- shadcn/ui documentation — Component patterns (official docs, training data)

### Secondary (MEDIUM confidence)
- Neon serverless documentation (known from Phase 1)
- Project CLAUDE.md conventions — Mobile-first, color scheme, patterns (HIGH confidence)
- Database schema (src/db/schema.ts) — Verified existing structure (HIGH confidence)
- Existing components (src/components/ui/) — Verified available shadcn/ui components (HIGH confidence)

### Tertiary (LOW confidence)
- WebSearch results — Rate-limited, could not verify 2026 best practices (LOW confidence)
- Safari ITP behavior — General knowledge, may need testing (MEDIUM confidence)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies verified from package.json
- Architecture: MEDIUM - Patterns based on Next.js 15/16 best practices, but web search rate-limited
- Pitfalls: HIGH - Race conditions, cookies, and re-renders are well-documented issues
- Code examples: HIGH - Based on official documentation and existing project patterns
- Environment availability: HIGH - All dependencies verified via npm list

**Research date:** 2026-03-30
**Valid until:** 2026-04-27 (30 days - fast-moving framework ecosystem)

**Key risks:**
1. Web search rate-limiting prevented verification of 2026-specific patterns
2. Safari ITP cookie behavior may require testing on actual devices
3. Match status transition logic needs clarification (draft → open trigger)
4. nanoid not installed but recommended (has fallback)

**Next steps for planner:**
1. Install missing dependency: `pnpm add nanoid`
2. Clarify match status transition triggers in PLAN.md
3. Define location autocomplete data source (static vs API)
4. Consider adding database unique constraint on guest_token column
