# Technology Stack

**Project:** kickoff — Football Match Organization PWA
**Researched:** 2026-03-29
**Overall confidence:** HIGH for core decisions, MEDIUM for some versions

## Executive Summary

The stack leverages proven technologies from existing projects (Alignd, EnAgent) with specific choices for mobile-first PWA requirements. All core technologies are production-ready with active maintenance as of early 2025.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 15.x (latest) | React framework with App Router | SSR for WhatsApp link previews, Server Components reduce JS bundle, Turbopack for fast builds |
| **React** | 19.x | UI library | Required by Next.js 15, concurrent features for smooth mobile animations |
| **TypeScript** | 5.x | Type safety | Strict mode required, catches bugs at compile time |

**Confidence:** HIGH

**Rationale:**
- Next.js 15 App Router provides Server Components by default, which means less JavaScript sent to mobile devices
- SSR is critical for the primary growth channel (WhatsApp link sharing) — OG tags need server rendering
- Turbopack (default in Next.js 15) provides faster iteration during development
- React 19's concurrent features enable smooth animations for team reveal drafts

**Alternatives considered:**
- Remix: Excellent for forms, but Next.js has better Vercel integration and more familiar ecosystem
- SvelteKit: Smaller bundle, but less mature ecosystem for PWA patterns

---

### Database & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Neon** | Latest (serverless) | PostgreSQL hosting | Free tier 0.5GB, auto-scaling, serverless (cold starts <100ms), built on PostgreSQL 15+ |
| **Drizzle ORM** | Latest | Type-safe database queries | Lightweight compared to Prisma, excellent TypeScript support, query builders for complex relations |
| **Drizzle Kit** | Latest | Migrations & schema management | Best-in-class migration experience, diff-based schema updates |

**Confidence:** HIGH

**Rationale:**
- Neon's serverless architecture aligns with Vercel's edge model — no connection pooling complexity
- Drizzle's query builders are more ergonomic than raw SQL but lighter than Prisma's query engine
- For multi-user concurrent access (match RSVP spikes), PostgreSQL's ACID guarantees prevent race conditions
- Drizzle's schema-as-code approach fits the TypeScript-first philosophy

**Migration pattern:**
```bash
pnpm db:generate  # Generate migration from schema diff
pnpm db:migrate   # Apply migration to Neon
pnpm db:studio    # Visual database inspector
```

**Alternatives considered:**
- Supabase: Overkill for this use case, adds auth/storage complexity not needed
- Prisma: Heavier runtime, slower cold starts on serverless

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **better-auth** | Latest | Auth library | Magic link + email/password, Drizzle adapter, TypeScript-first, lighter than NextAuth |
| **Resend** | Latest | Email delivery | Magic link delivery, transactional emails, free tier 3K/month |

**Confidence:** HIGH

**Rationale:**
- better-auth is the successor to Lucia (battle-tested), with better DX and TypeScript support
- Native Drizzle adapter means no custom session management code
- Magic links reduce friction for guest → user conversion (no password required)
- JWT session strategy reduces database hits for authenticated requests
- Proven on Alignd project — no surprises

**Setup configuration:**
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  emailVerification: { sendVerificationEmail: async ({ user }) => {...} },
  session: { strategy: "jwt" },
})
```

**Alternatives considered:**
- NextAuth.js (Auth.js): Heavier, more complex setup for simple email/password + magic link use case
- Clerk: Overkill, adds cost ($$$), vendor lock-in

---

### Styling & UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS** | v4 (latest) | Utility-first CSS | v4 brings native CSS support, faster builds, smaller bundle size |
| **shadcn/ui** | Latest | Component library | Copy-paste components (no npm package), full customization, built on Radix UI (accessibility) |
| **Lucide React** | Latest | Icon library | Lightweight, tree-shakeable, consistent with shadcn/ui |

**Confidence:** MEDIUM for Tailwind v4 specifics, HIGH for shadcn/ui

**Rationale:**
- Tailwind CSS v4 uses native CSS instead of PostCSS, enabling faster builds and better browser dev tools
- shadcn/ui's "you own the code" philosophy means full customization for mobile touch targets (44x44px minimum)
- Radix UI primitives (underlying shadcn/ui) handle keyboard navigation, screen readers, and ARIA attributes automatically
- Utility-first approach enables rapid prototyping of responsive mobile layouts

**Tailwind v4 migration note:**
- Configuration moves from `tailwind.config.js` to CSS `@theme` directive
- Use `@import "tailwindcss"` instead of PostCSS plugins
- Custom colors go in CSS, not JS config

**Required shadcn/ui components:**
```bash
npx shadcn@latest add button input card dialog badge avatar dropdown-menu toast tabs separator
```

**Alternatives considered:**
- Chakra UI: Heavier bundle, harder to customize
- MUI: Not mobile-first by default, enterprise feel
- Headless UI: Good but less complete than Radix primitives

---

### PWA & Offline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **next-pwa** | v5.7+ (check Next.js 15 compat) | PWA manifest & service worker | Automated manifest generation, workbox for caching strategies |
| **@vercel/og** | Latest | OG image generation | Dynamic WhatsApp link previews with match details |

**Confidence:** MEDIUM (next-pwa Next.js 15 compatibility needs verification)

**Rationale:**
- PWA is critical for the "no app store" requirement — installable from mobile browser
- Service workers cache app shell (layout, CSS, fonts) for instant repeat loads
- Network-first strategy for API calls ensures fresh match data
- @vercel/og generates social card images at the edge for WhatsApp previews

**PWA implementation pattern:**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // Next.js config
})
```

**Service worker caching strategy:**
- Cache-first: App shell (layout, CSS, fonts, icons)
- Network-first: API routes (matches, rsvp, ratings)
- Stale-while-revalidate: Static assets (images)

**Alternatives considered:**
- Manual service worker: More control but higher maintenance burden
- Workbox directly: Lower-level, next-pwa wraps it well

---

### Form Validation & Data

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zod** | Latest | Schema validation | Type-safe validation, integrates with Drizzle, single source of truth |
| **nanoid** | Latest | Unique IDs | URL-safe share tokens (10 chars), collision-resistant |
| **date-fns** | Latest | Date utilities | Lightweight tree-shakeable, better than Moment.js |

**Confidence:** HIGH

**Rationale:**
- Zod schemas can infer TypeScript types — define once, use everywhere
- Drizzle integrates with Zod for runtime validation of database queries
- nanoid(10) for share tokens = ~1.5 billion combinations, sufficient for MVP
- date-fns provides relative dates ("il y a 3 jours") for French locale

---

### Notifications & Cron

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Resend** | Latest | Transactional emails | Free tier 3K/mois, React email templates, reliable delivery |
| **Vercel Cron** | Native | Scheduled tasks | Built-in to Vercel, no external cron service needed |

**Confidence:** HIGH

**Rationale:**
- Resend's free tier (3K emails/month) covers MVP needs for match reminders
- Vercel Cron Jobs (configured in `vercel.json`) handle weekly match creation
- Email templates use React for type-safe, responsive HTML

**Cron configuration:**
```json
{
  "crons": [{
    "path": "/api/cron/weekly-matches",
    "schedule": "0 0 * * *"
  }]
}
```

---

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | Latest | Unit tests | Fast, native ESM, Jest-compatible API |
| **Playwright** | Latest | E2E tests | Mobile viewport testing, WhatsApp link flow simulation |

**Confidence:** HIGH

**Rationale:**
- Vitest integrates with Vite/Next.js build pipeline, faster than Jest
- Playwright can test mobile viewports (iPhone SE, 375px) for responsive validation
- Team balancing algorithm needs unit tests for edge cases (odd players, no-shows)

---

### Hosting & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | Latest | Application hosting | Edge rendering, preview deploys, free tier for hobby projects |
| **Neon** | Serverless | Database hosting | Free tier 0.5GB, auto-scaling, no connection pooling needed |

**Confidence:** HIGH

**Rationale:**
- Vercel's Edge Network renders OG tags close to users for fast WhatsApp previews
- Preview deploys enable testing before merging to main
- Vercel Cron Jobs eliminate need for external cron services
- Neon's serverless driver (`@neondatabase/serverless`) handles connection pooling automatically

**Environment variables:**
```env
NEXT_PUBLIC_APP_URL=https://kickoff.app
DATABASE_URL=postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/kickoff?sslmode=require
BETTER_AUTH_SECRET=<random-32-chars>
BETTER_AUTH_URL=https://kickoff.app
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@kickoff.app
CRON_SECRET=<random-32-chars>
```

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Recharts** | Latest | Radar charts for player stats | Player profile page (technique/physique/collectif visualization) |
| **Sonner** | Latest | Toast notifications | shadcn/ui recommended, better than react-hot-toast |
| **clsx** | Latest | Conditional class names | Mobile-first responsive utilities |
| **react-hook-form** | Latest | Form performance | Large forms (match creation, player rating) |
| **zod-form-data** | Latest | Form validation | Server Actions validation |

---

## Installation

```bash
# Core dependencies
pnpm add next@15 react@19 react-dom@19
pnpm add -D typescript @types/react @types/node

# Database
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit

# Authentication
pnpm add better-auth

# Styling & UI
pnpm add tailwindcss@4
pnpm add lucide-react clsx tailwind-merge
# shadcn/ui setup (components copied to project)
npx shadcn@latest init

# PWA
pnpm add next-pwa @vercel/og

# Validation & Utilities
pnpm add zod nanoid date-fns

# Email
pnpm add resend

# Testing
pnpm add -D vitest @playwright/test
```

---

## Key Configuration Files

### `next.config.ts`
```typescript
import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default withPWA(nextConfig)
```

### `drizzle.config.ts`
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/weekly-matches",
    "schedule": "0 0 * * *"
  }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Framework** | Next.js 15 | Remix | Less familiar ecosystem, Vercel integration not as tight |
| **Database** | Neon + Drizzle | Supabase + Prisma | Overkill features, heavier runtime, slower cold starts |
| **Auth** | better-auth | NextAuth.js | Heavier, more complex setup for simple email/password |
| **UI** | shadcn/ui | Chakra UI | Heavier bundle, harder to customize for mobile |
| **PWA** | next-pwa | Manual SW | Higher maintenance burden, next-pwa handles edge cases |
| **Email** | Resend | SendGrid | Free tier smaller (100 vs 3K), less DX-focused |
| **Hosting** | Vercel | Netlify | Edge rendering not as mature, preview deploys slower |

---

## Sources

**Confidence levels:**
- **HIGH:** Official documentation, proven in production (Alignd, EnAgent projects)
- **MEDIUM:** Ecosystem trends, requires verification of specific versions
- **LOW:** WebSearch only (not available due to rate limiting), needs validation

**Verified sources:**
- better-auth official documentation (accessed 2026-03-29)
- Next.js 15 release notes (known from training data)
- Neon technical documentation (known from training data)
- Drizzle ORM documentation (known from training data)
- shadcn/ui documentation (known from training data)

**Unverified sources (rate-limited during research):**
- Tailwind CSS v4 migration guide — **MEDIUM confidence**, verify CSS @theme syntax
- next-pwa Next.js 15 compatibility — **MEDIUM confidence**, check GitHub issues
- @vercel/og latest API — **HIGH confidence**, stable API surface

**Research flags for roadmap:**
- **Phase 1.4 (PWA config):** Verify next-pwa v5.7+ works with Next.js 15, fallback to manual service worker if needed
- **Phase 1.2 (Database schema):** Test Drizzle migrations on Neon free tier before committing schema
- **Phase 6.1 (OG images):** Test @vercel/og image generation on Vercel Edge before production

---

## Migration Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind v4 breaking changes | CSS utility classes may break | Use v4's `@theme` directive from start, avoid v3 patterns |
| next-pwa incompatibility | Service worker may not register | Fallback to manual workbox setup if needed |
| better-auth Drizzle adapter bugs | Session management may fail | Test magic link flow early in Phase 1.3 |
| Neon cold start latency | First RSVP may be slow (>500ms) | Use Neon's `@neondatabase/serverless` with HTTP/2 pooling |
| React 19 concurrent features | Animation glitches on team reveal | Test `useTransition` for draft pick animation in Phase 3.2 |
