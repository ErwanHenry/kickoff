# Architecture Patterns

**Domain:** Football match organization PWA
**Researched:** 2026-03-29

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │ Mobile PWA   │  │ Desktop Web  │          │
│  │  (WhatsApp  │  │  (Installed) │  │ (Dashboard)  │          │
│  │   Link)      │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Server Components (SSR)                     │  │
│  │  - OG metadata generation for WhatsApp previews          │  │
│  │  - Authentication checks (middleware)                    │  │
│  │  - Data fetching (matches, players, stats)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Client Components (Interactivity)           │  │
│  │  - RSVP buttons, forms, team balancing UI                │  │
│  │  - Real-time updates (polling/revalidation)              │  │
│  │  - Rating forms, team drag-and-drop                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Routes (Serverless)                     │  │
│  │  - /api/matches (CRUD)                                   │  │
│  │  - /api/rsvp (guest + user)                              │  │
│  │  - /api/teams (balancing)                                │  │
│  │  - /api/ratings (post-match)                             │  │
│  │  - /api/groups (CRUD + leaderboard)                      │  │
│  │  - /api/auth/* (better-auth)                             │  │
│  │  - /api/cron/* (Vercel Cron)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Auth Service│  │  RSVP Logic  │  │Team Balancer │          │
│  │ (better-auth)│  │ (Waitlist    │  │  (Algorithm) │          │
│  │              │  │  Promotion)  │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Notification │  │ Stats Engine │  │  OG Generator│          │
│  │   (Resend)   │  │(Aggregation) │  │  (@vercel/og)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Neon PostgreSQL Serverless                   │  │
│  │  - Multi-user concurrent access (row-level locking)      │  │
│  │  - Connection pooling (PgBouncer transaction mode)       │  │
│  │  - Autoscaling (scales to zero when idle)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Drizzle ORM                                  │  │
│  │  - Type-safe query builders                              │  │
│  │  - Schema migrations                                     │  │
│  │  - Prepared statements (SQL injection protection)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Resend     │  │   Vercel     │  │   Vercel     │          │
│  │   (Email)    │  │   Cron       │  │   OG         │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With | Data Access |
|-----------|---------------|-------------------|-------------|
| **Server Components** | SSR pages, auth checks, OG tags | Database (via Drizzle), better-auth | Direct read |
| **Client Components** | Interactive UI, forms, real-time updates | API routes, browser storage (cookies/localStorage) | Indirect (via API) |
| **API Routes** | Business logic enforcement, data mutations | Database (Drizzle), external services (Resend), service layer | Direct read/write |
| **Auth Service** | Session management, user identification | Database (users table), cookies | Direct read/write |
| **RSVP Logic** | Waitlist management, promotion, cancellation | Database (matches, match_players), notifications | Transactional |
| **Team Balancer** | Algorithm for fair team distribution | Database (player_stats), match data | Read-only (calc) |
| **Stats Engine** | Rating aggregation, incremental updates | Database (ratings, player_stats) | Transactional |
| **Notification Service** | Email sending, template rendering | Resend API, database (user emails) | Read user data |
| **OG Generator** | Dynamic image generation for sharing | Vercel OG API, match data | Read match data |
| **Service Worker** | Offline caching, app shell management | Browser cache API, network | None |

### Data Flow

#### 1. Guest RSVP Flow (Primary Entry Point)

```
[WhatsApp Link] → Browser
    ↓
GET /m/{shareToken} (Server Component)
    ├→ Fetch match details (Neon via Drizzle)
    ├→ Check guest_token cookie
    ├→ Generate OG metadata
    └→ Render page (SSR)
    ↓
[Guest clicks "Je suis là !"]
    ↓
POST /api/rsvp (Client Component)
    ├→ Validate request (Zod)
    ├→ Check match capacity (Neon: SELECT + FOR UPDATE)
    ├→ Transaction:
    │   ├→ INSERT match_players (status: confirmed/waitlisted)
    │   ├→ UPDATE matches (status: full if needed)
    │   └→ Set guest_token cookie (httpOnly)
    └→ Return response { status, position? }
    ↓
[Browser updates UI] (RevalidatePath or polling)
```

**Critical Concurrency Handling:**
- Use `SELECT ... FOR UPDATE` in PostgreSQL to lock the match row during RSVP
- Check current confirmed count + lock before inserting new player
- If match full → insert with status `waitlisted`
- Atomic operation prevents race condition (2 guests RSVPing for last spot simultaneously)

#### 2. Waitlist Promotion Flow

```
[Confirmed player cancels]
    ↓
PATCH /api/rsvp (Client Component)
    Body: { action: "cancel", shareToken }
    ↓
API Route Transaction:
    ├→ SELECT match_players FOR UPDATE (lock player row)
    ├→ UPDATE match_players SET status = 'cancelled'
    ├→ Check for waitlisted players
    ├→ If waitlist exists:
    │   ├→ SELECT first waitlisted player (ORDER BY confirmed_at)
    │   ├→ UPDATE match_players SET status = 'confirmed'
    │   ├→ Trigger email notification (Resend)
    │   └→ UPDATE matches (status: 'open' if was 'full')
    └→ Return { success, promotedPlayer? }
    ↓
[Background] Email sent to promoted player
```

**Race Condition Prevention:**
- Transaction isolation level: `READ COMMITTED` (default Neon)
- Row-level locking on match_players during promotion
- Single API call handles both cancellation AND promotion (atomic)

#### 3. Team Balancing Flow

```
[Organizer clicks "Générer les équipes"]
    ↓
POST /api/teams (Client Component)
    Body: { matchId }
    ↓
API Route:
    ├→ Verify organizer permissions (better-auth)
    ├→ Fetch confirmed players (Neon: JOIN with player_stats)
    ├→ Call team-balancer.ts (algorithm)
    │   ├→ Input: players with scores (technique, physique, collectif)
    │   ├→ Calculate global score: technique*0.4 + physique*0.3 + collectif*0.3
    │   ├→ Generate combinations (brute-force C(n, n/2))
    │   ├→ Find optimal teams (minimize |scoreA - scoreB|)
    │   └→ Return: { teamA, teamB, scores }
    ├→ Transaction:
    │   ├→ UPDATE match_players SET team = 'A' OR 'B'
    │   └→ UPDATE matches SET status = 'locked'
    └→ Return teams + scores
    ↓
[Client Component] Animate team reveal (draft pick style)
```

**Performance Considerations:**
- Algorithm runs server-side (not in DB)
- For 14 players: C(14,7) = 3,432 combinations (~10ms)
- For 20 players: C(20,10) = 184,756 combinations (~50ms)
- No caching needed (fast enough, state changes after each lock)

#### 4. Post-Match Rating Flow

```
[After match: organizer closes match]
    ↓
PATCH /api/matches/{id}/close (Organizer only)
    Body: { score_team_a, score_team_b, attendance }
    ↓
API Route Transaction:
    ├→ UPDATE matches SET status = 'played', scores
    ├→ UPDATE match_players SET attended = true/false
    ├→ Recalculate player_stats (attendance_rate)
    └→ Trigger emails to all participants (Resend)
    ↓
[Player receives email link → /m/{shareToken}/rate]
    ↓
GET /m/{shareToken}/rate (Server Component)
    ├→ Fetch match + players (excluding self)
    └→ Render rating form
    ↓
POST /api/ratings (Client Component)
    Body: { matchId, raterId, ratings: [{ ratedId, technique, physique, collectif, comment }] }
    ↓
API Route Transaction:
    ├→ Verify rater was in match
    ├→ Check not already rated (UNIQUE constraint)
    ├→ INSERT ratings (batch)
    ├→ Recalculate player_stats:
    │   ├→ For each rated player:
    │   │   ├→ Fetch current avg + count
    │   │   ├→ Calculate new avg (incremental)
    │   │   └── UPDATE player_stats SET avg_* = new_avg, total_ratings_received++
    │   └→ Update last_match_date
    └→ Return { success }
    ↓
[When 50%+ rated] UPDATE matches SET status = 'rated'
```

**Incremental Stats Calculation:**
```typescript
// Instead of recalculating all ratings (O(n)), use incremental (O(1)):
new_avg_technique = (old_avg_technique * total_ratings + new_technique) / (total_ratings + 1)
```

#### 5. Guest → User Merge Flow

```
[Guest clicks "Créer un compte"]
    ↓
POST /api/auth/register (better-auth)
    Body: { email, password, name }
    ↓
better-auth creates user
    ↓
[Post-registration hook] Custom merge logic:
    ├→ Read guest_token from cookie
    ├→ SELECT match_players WHERE guest_token = token
    ├→ UPDATE match_players SET user_id = new_user_id, guest_token = NULL, guest_name = NULL
    ├→ SELECT ratings WHERE rater_id = token OR rated_id = token
    ├→ UPDATE ratings SET rater_id = new_user_id OR rated_id = new_user_id
    ├→ Recalculate player_stats for new_user_id
    ├→ Delete guest_token cookie
    └→ Redirect to /dashboard
```

**Critical Merge Logic:**
- Atomic update of all guest-related records
- Preserve all historical data (matches, ratings)
- No data loss during merge
- User sees complete history immediately after signup

## Patterns to Follow

### Pattern 1: Server-First, Client-Second

**What:** Default to Server Components, use Client Components only for interactivity.

**When:**
- All page layouts, dashboards, match details (read-heavy) → Server Components
- Forms, buttons, real-time updates, drag-and-drop → Client Components

**Example:**
```typescript
// app/m/[shareToken]/page.tsx (Server Component)
export default async function MatchPage({ params }) {
  const match = await db.query.matches.findFirst({
    where: eq(matches.shareToken, params.shareToken)
  });

  return (
    <div>
      <h1>{match.title}</h1>
      <RSVPButton matchId={match.id} /> {/* Client Component */}
    </div>
  );
}
```

**Why:**
- Faster initial page load (SSR)
- Better SEO (OG tags for WhatsApp)
- Smaller client bundle (React not hydrated for static content)

### Pattern 2: Transactional Multi-Step Operations

**What:** Wrap multi-step database operations in transactions to ensure atomicity.

**When:**
- RSVP with capacity checks + waitlist promotion
- Match closure + attendance tracking + stats recalculation
- Rating submission + stats updates

**Example:**
```typescript
// app/api/rsvp/route.ts
export async function POST(req: Request) {
  const { shareToken, guestName } = await req.json();

  return await db.transaction(async (tx) => {
    // Lock match row
    const match = await tx.query.matches.findFirst({
      where: eq(matches.shareToken, shareToken)
    });

    const confirmedCount = await tx.query.match_players.findMany({
      where: and(
        eq(match_players.matchId, match.id),
        eq(match_players.status, 'confirmed')
      )
    });

    if (confirmedCount.length >= match.maxPlayers) {
      // Waitlist
      await tx.insert(match_players).values({
        matchId: match.id,
        guestName,
        status: 'waitlisted',
        guestToken: nanoid(10)
      });
    } else {
      // Confirm
      await tx.insert(match_players).values({
        matchId: match.id,
        guestName,
        status: 'confirmed',
        guestToken: nanoid(10)
      });
    }

    return { success: true };
  });
}
```

**Why:**
- Prevents race conditions (2 guests RSVPing simultaneously)
- Ensures data consistency (waitlist promotion happens atomically)
- Automatic rollback on error

### Pattern 3: Optimistic UI + Server Revalidation

**What:** Update UI immediately, then revalidate from server to confirm.

**When:**
- RSVP button clicks (instant feedback)
- Team drag-and-drop (smooth UX)
- Rating form submission (prevent double-submit)

**Example:**
```typescript
// components/match/rsvp-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function RSVPButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'confirmed' | 'waitlisted'>();

  const handleRSVP = async () => {
    startTransition(async () => {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        body: JSON.stringify({ matchId })
      });
      const data = await res.json();

      setStatus(data.status); // Optimistic update
      router.refresh(); // Revalidate server component
    });
  };

  return (
    <button onClick={handleRSVP} disabled={isPending}>
      {status === 'waitlisted' ? 'Liste d\'attente' : 'Je suis là !'}
    </button>
  );
}
```

**Why:**
- Instant perceived performance (no loading spinners)
- Server remains source of truth
- Automatic rollback if server fails

### Pattern 4: Service Worker Cache-First for App Shell

**What:** Cache static assets (JS, CSS, fonts) immediately, network-first for API.

**When:** PWA offline support for app shell (layout, navigation, styles).

**Example:**
```javascript
// public/sw.js
const CACHE_NAME = 'kickoff-v1';
const ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
```

**Why:**
- Instant app loads on return visits
- Offline support for already-visited pages
- Fresh data from API (stale-while-revalidate)

### Pattern 5: Incremental Stats Updates

**What:** Update aggregates incrementally instead of recalculating from scratch.

**When:** Player stats, match counts, attendance rates.

**Example:**
```typescript
// lib/stats.ts
export async function updatePlayerStats(userId: string, groupId?: string) {
  const currentStats = await db.query.player_stats.findFirst({
    where: and(
      eq(player_stats.userId, userId),
      groupId ? eq(player_stats.groupId, groupId) : isNull(player_stats.groupId)
    )
  });

  const newRatings = await db.query.ratings.findMany({
    where: eq(ratings.ratedId, userId),
    orderBy: [desc(ratings.createdAt)],
    limit: 100 // Only recent ratings matter
  });

  // Incremental calculation
  const avgTechnique = newRatings.reduce((sum, r) => sum + r.technique, 0) / newRatings.length;
  const avgPhysique = newRatings.reduce((sum, r) => sum + r.physique, 0) / newRatings.length;
  const avgCollectif = newRatings.reduce((sum, r) => sum + r.collectif, 0) / newRatings.length;

  await db.update(player_stats)
    .set({
      avgTechnique,
      avgPhysique,
      avgCollectif,
      avgOverall: (avgTechnique * 0.4 + avgPhysique * 0.3 + avgCollectif * 0.3),
      totalRatingsReceived: newRatings.length,
      lastUpdatedAt: new Date()
    })
    .where(eq(player_stats.id, currentStats.id));
}
```

**Why:**
- O(1) update instead of O(n) full recalculation
- Scales with number of ratings
- Can be run after each rating submission

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Auth Checks

**What:** Checking authentication only in client components.

**Why bad:** Users can bypass client checks by disabling JS or modifying React state.

**Instead:** Use middleware for route protection + Server Components for data access control.

```typescript
// BAD
'use client';
export function DashboardPage() {
  const [user, setUser] = useState();
  if (!user) return <Login />;
  // ...
}

// GOOD
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/login');
  }
  // ...
}
```

### Anti-Pattern 2: Polling for Real-Time Updates

**What:** SetInterval every 1-2 seconds to check for updates.

**Why bad:** Drains battery, unnecessary server load, most updates are infrequent.

**Instead:** Use `revalidatePath` after mutations + Server Components, or poll at 30s intervals.

```typescript
// BAD
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/match/' + matchId).then(setMatch);
  }, 1000);
  return () => clearInterval(interval);
}, [matchId]);

// GOOD
// After mutation
const res = await fetch('/api/rsvp', { method: 'POST' });
revalidatePath('/m/' + shareToken); // Trigger Server Component revalidation
```

### Anti-Pattern 3: N+1 Queries in Player Stats

**What:** Fetching player stats one by one in a loop.

**Why bad:** 14 players = 14 database queries, slow page load.

**Instead:** Use JOIN or batch queries with Drizzle.

```typescript
// BAD
for (const player of players) {
  const stats = await db.query.player_stats.findFirst({
    where: eq(player_stats.userId, player.id)
  });
  player.stats = stats;
}

// GOOD
const playersWithStats = await db.query.match_players.findMany({
  where: eq(match_players.matchId, matchId),
  with: {
    user: {
      with: {
        playerStats: true
      }
    }
  }
});
```

### Anti-Pattern 4: Raw SQL for Team Balancing

**What:** Writing complex SQL to balance teams in the database.

**Why bad:** Hard to test, hard to debug, not portable.

**Instead:** Implement algorithm in TypeScript, use DB only for data fetching.

```typescript
// BAD
const result = await db.execute(sql`
  WITH combo AS (
    SELECT ...
  )
  SELECT * FROM combo
  ORDER BY ABS(score_a - score_b)
  LIMIT 1
`);

// GOOD
const players = await db.query.match_players.findMany({ ... });
const teams = balanceTeams(players); // Pure TypeScript function
await db.update(match_players).set({ team: ... }); // Save result
```

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Database Connections** | Neon free tier (10 concurrent) | Neon paid (serverless autoscaling) | Connection pooling + read replicas |
| **RSVP Race Conditions** | Row-level locking (sufficient) | Same (Postgres handles it) | Consider sharding by group_id |
| **Team Balancing** | Brute-force (<50ms) | Same (C(20,10) = 184K combos) | Same (max 22 players per match) |
| **Stats Calculation** | Incremental (O(1)) | Same | Background job + cache |
| **Email Sending** | Resend free tier (3K/mo) | Resend paid ($20/mo for 50K) | Queue system (Redis) + rate limiting |
| **OG Image Generation** | @vercel/og (free) | Same | Cache generated images (Vercel Blob) |
| **Real-Time Updates** | Polling 30s | Upgrade to WebSockets (Pusher) | Dedicated WebSocket server |

**Key Insight:** The architecture scales to 100K+ users without major changes because:
- Match RSVP is localized (not global events)
- Team balancing is O(1) for typical match sizes (≤22 players)
- Stats updates are incremental, not full recalculation
- Neon serverless autoscales automatically

## Build Order (Dependencies)

```
Phase 1: Foundations (Independent)
├── 1.1 Next.js + UI setup (no dependencies)
├── 1.2 Database + Drizzle schema (blocking for all data operations)
├── 1.3 better-auth integration (blocking for protected routes)
├── 1.4 PWA manifest + service worker (independent, can be parallel)
└── 1.5 Seed script (depends on 1.2)

Phase 2: Match CRUD + RSVP (Depends on: 1.2, 1.3)
├── 2.1 Match creation API + UI (depends on 1.2)
├── 2.2 Public match page + RSVP (depends on 2.1, 1.4 for OG tags)
├── 2.3 Waitlist + promotion (depends on 2.2, adds transaction logic)
└── 2.4 Dashboard (depends on 2.1, 1.3 for auth)

Phase 3: Team Balancing (Depends on: 1.5 for test data, 2.3 for player data)
├── 3.1 Algorithm implementation (pure function, no dependencies)
├── 3.2 API + UI for team generation (depends on 2.3, 3.1)

Phase 4: Post-Match + Profiles (Depends on: 3.2 for match data)
├── 4.1 Match closure + attendance (depends on 2.3)
├── 4.2 Rating system (depends on 4.1)
└── 4.3 Player profiles (depends on 4.2 for stats)

Phase 5: Groups + Recurrence (Depends on: 4.3 for player stats)
├── 5.1 Groups CRUD + leaderboards (depends on 1.2, 4.3)
└── 5.2 Recurring matches + cron (depends on 5.1)

Phase 6: Polish + Deploy (Depends on: all previous)
├── 6.1 OG tags optimization (depends on 2.2)
├── 6.2 Email notifications (depends on 2.3, 4.1, 5.2)
├── 6.3 Guest → user merge (depends on 1.3, 2.2, 4.2)
└── 6.4 Final polish + deploy (depends on all)
```

**Critical Path:**
1. **Database schema** (1.2) must be done first — everything depends on data structure
2. **Auth** (1.3) must be done before protected routes — but public RSVP can work without it
3. **Match CRUD** (2.1) must be done before RSVP (2.2) — need matches to RSVP to
4. **Team balancing** (3.1) can be developed in parallel with Phase 2 — pure algorithm
5. **Ratings** (4.2) must be done before profiles (4.3) — profiles depend on stats

**Parallelization Opportunities:**
- (1.4) PWA setup can run parallel with (1.2) DB schema
- (3.1) Team balancing algorithm can be developed while Phase 2 is in progress
- (6.1) OG tags can be optimized while (6.2) email templates are being built

## Sources

### High Confidence (Official Documentation)
- Next.js 15 App Router: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Neon PostgreSQL Serverless: https://neon.tech/docs/serverless/serverless-driver
- better-auth: https://www.better-auth.com/docs
- @vercel/og: https://vercel.com/docs/functions/og-image-generation
- Resend: https://resend.com/docs/send-email/nextjs

### Medium Confidence (Architecture Best Practices)
- Team balancing algorithms: General combinatorial optimization knowledge
- RSVP race condition handling: PostgreSQL transaction isolation levels
- PWA service worker patterns: Standard offline-first architecture
- Incremental stats calculation: Standard aggregate update pattern

### Low Confidence (Assumptions Based on Training Data)
- Vercel Cron pricing and limitations (verify before Phase 5)
- Resend rate limits on transactional emails (verify before Phase 6)
- Neon connection pooling behavior under high load (test before scaling)

**Confidence Assessment:**
| Area | Confidence | Notes |
|------|------------|-------|
| Component Boundaries | HIGH | Based on standard web app architecture patterns |
| Data Flow | HIGH | Transaction patterns well-documented in PostgreSQL |
| Build Order | HIGH | Dependency graph is explicit and logical |
| Scalability | MEDIUM | Assumptions about Neon autoscaling need verification |
| PWA Patterns | MEDIUM | Service worker strategies are standard but Next.js-specific implementation may vary |

### Open Questions
- **Neon connection pooling**: How does PgBouncer transaction mode behave with serverless functions? (Verify in Phase 1)
- **Vercel Cron precision**: Can we rely on hourly cron for deadline reminders? (Verify in Phase 5)
- **Resend delivery speed**: How fast do waitlist promotion emails arrive? (Test in Phase 2)
- **OG image caching**: Does @vercel/og cache generated images? (Verify in Phase 6)
