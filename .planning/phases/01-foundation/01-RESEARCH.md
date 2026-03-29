# Phase 1: Foundation - Research

**Researched:** 2026-03-30
**Domain:** Project setup, authentication, PWA infrastructure
**Confidence:** HIGH

## Summary

Phase 1 establishes the technical foundation for the kickoff app: Next.js 15 with App Router, Neon PostgreSQL with Drizzle ORM, better-auth for authentication (email/password + magic link), Tailwind CSS v4 with shadcn/ui, and PWA infrastructure.

Research confirms all chosen technologies are production-ready with current versions. Key findings: better-auth 1.5.6 has native Drizzle adapter with experimental joins support; Tailwind v4.2.2 works seamlessly with shadcn/ui using CSS-first configuration; Next.js 16.2.1 has built-in PWA support without requiring next-pwa (recommended approach over next-pwa due to Turbopack conflicts).

**Primary recommendation:** Use Next.js native PWA support (manifest.ts + manual service worker) instead of next-pwa to avoid Turbopack compatibility issues. Configure better-auth with session durations that support the "remember me" checkbox (7 days default, 30 days extended).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single page with tabs at `/login` -- "Connexion" and "Inscription" tabs on one page, less navigation friction on mobile
- **D-02:** Email/password is the primary login method -- magic link appears as secondary option ("Connexion sans mot de passe") below the password field
- **D-03:** Form validation uses both inline errors per field AND summary toast -- maximum visibility for users
- **D-04:** "Se souvenir de moi" checkbox extends session from 7 days to 30 days -- good for regular players on personal devices
- **D-05:** Single flexible "Nom" field for registration -- accepts first name, nickname, full name, or pseudo. No format validation. Label: "Nom" or "Comment tu t'appelles ?"
- **D-06:** Post-auth redirect to `/dashboard` for Phase 1 -- user type-specific routing is a Phase 2+ concern
- **D-07:** Hero with problem + solution headline -- "Fini le bordel sur WhatsApp. Cree ton match, partage le lien." (or similar)
- **D-08:** 3 feature icons below hero -- quick value props: Inviter, Equilibrer, Noter
- **D-09:** Primary CTA: "C'est parti !" to `/login`
- **D-10:** Install prompt appears after login/register -- user has committed to an account, good engagement moment
- **D-11:** Offline mode shows cached pages with "Hors ligne" banner -- actions disabled, but user can browse previously visited content
- **D-12:** Splash screen: "kickoff" logo/text on #2D5016 (vert terrain) background -- clean, fast load feel
- **D-13:** Display mode: standalone -- full-screen app experience, no browser chrome
- **D-14:** App icon: football/soccer ball on #2D5016 green background -- recognizable, on-theme
- **D-15:** Push notifications deferred to Phase 10 -- keep Phase 1 simple, email notifications come later

### Claude's Discretion
- Error message copy and tone (French, casual but clear)
- Exact spacing/layout within the decided structure
- Animation/transition details for tab switching
- Service worker caching strategy details (cache-first for shell, network-first for API)

### Deferred Ideas (OUT OF SCOPE)
- User type-specific routing (Phase 2+)
- Full role permissions implementation (Phase 8)
- Democratic captain vote mechanism (Future/v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email and password | better-auth `signUp.email` with Zod validation |
| AUTH-02 | User can log in with email/password | better-auth `signIn.email` with rememberMe option |
| AUTH-03 | User can request magic link login via email | better-auth magic link plugin + Resend integration |
| AUTH-04 | User session persists across browser refresh | JWT session strategy with configurable expiresIn/updateAge |
| PWA-01 | App is installable as PWA (manifest, service worker) | Next.js native manifest.ts + manual service worker |
| PWA-02 | Service worker caches app shell for offline viewing | Cache-first strategy for layout, CSS, fonts |
| PWA-03 | App displays install prompt on eligible devices | beforeinstallprompt API + InstallPrompt component |
| PWA-04 | App works standalone after installation | display: standalone in manifest |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | React framework | SSR for WhatsApp previews, App Router, Turbopack |
| react | 19.x | UI library | Required by Next.js 16, concurrent features |
| typescript | 5.x | Type safety | Strict mode, zero any |
| drizzle-orm | 0.45.2 | Type-safe ORM | Lightweight, excellent PostgreSQL support |
| drizzle-kit | 0.31.10 | Migrations | Diff-based schema updates |
| @neondatabase/serverless | 1.0.2 | PostgreSQL | Serverless connection pooling |
| better-auth | 1.5.6 | Authentication | Native Drizzle adapter, magic link plugin |
| tailwindcss | 4.2.2 | CSS framework | CSS-first config, native support |
| zod | 4.3.6 | Validation | Type-safe schemas |
| nanoid | 5.1.7 | ID generation | URL-safe share tokens |
| resend | 6.9.4 | Email delivery | Magic links, free tier 3K/month |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn | 4.1.1 | UI components | Form inputs, buttons, dialogs |
| lucide-react | latest | Icons | Navigation, action buttons |
| sonner | latest | Toast notifications | Form errors, success messages |
| clsx | latest | Conditional classes | Responsive utilities |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual service worker | next-pwa | next-pwa conflicts with Turbopack in Next.js 15+ |
| better-auth | NextAuth.js | Heavier, more complex for email/password + magic link |
| Tailwind v4 CSS config | tailwind.config.js | v4 uses CSS-first, no JS config needed |

**Installation:**
```bash
# Create Next.js project
pnpm create next-app@latest kickoff --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Database
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit

# Authentication
pnpm add better-auth resend

# UI (run from project root)
npx shadcn@latest init
npx shadcn@latest add button input card dialog badge avatar dropdown-menu toast tabs separator

# Validation & Utilities
pnpm add zod nanoid
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Tabs: Connexion + Inscription
│   ├── (dashboard)/
│   │   └── page.tsx              # Placeholder for Phase 2
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts      # better-auth handler
│   ├── manifest.ts               # PWA manifest (dynamic)
│   ├── layout.tsx                # Root layout with PWA meta
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── auth/
│   │   ├── login-form.tsx        # Email/password form
│   │   ├── register-form.tsx     # Name/email/password form
│   │   └── magic-link-form.tsx   # Email-only form
│   └── install-prompt.tsx        # PWA install prompt
├── db/
│   ├── schema.ts                 # Drizzle schema (all tables)
│   ├── index.ts                  # Neon connection
│   └── migrations/               # Generated migrations
├── lib/
│   ├── auth.ts                   # better-auth server config
│   └── auth-client.ts            # better-auth client
└── middleware.ts                 # Route protection
```

### Pattern 1: better-auth with Drizzle Adapter

**What:** Configure better-auth with PostgreSQL via Drizzle adapter, supporting email/password and magic link authentication.

**When to use:** All authentication flows in this project.

**Example:**
```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    // Default: 7 days (604800 seconds)
    expiresIn: 60 * 60 * 24 * 7,
    // Refresh when session is 1 day old
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: "Connexion a kickoff",
          html: `<p>Clique sur ce lien pour te connecter: <a href="${url}">${url}</a></p>`,
        });
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
  experimental: {
    joins: true, // Better performance for session queries
  },
});

export type Session = typeof auth.$Infer.Session;
```

### Pattern 2: Remember Me Session Configuration

**What:** Implement session duration toggle based on "Se souvenir de moi" checkbox.

**When to use:** Sign-in form submission.

**Example:**
```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [magicLinkClient()],
});

// Usage in login form
const handleSignIn = async (email: string, password: string, rememberMe: boolean) => {
  const { data, error } = await authClient.signIn.email({
    email,
    password,
    rememberMe, // true = 30 days (configured server-side), false = 7 days
    callbackURL: "/dashboard",
  });

  if (error) {
    toast.error(error.message);
    return;
  }
};
```

### Pattern 3: Drizzle PostgreSQL Enums

**What:** Define PostgreSQL enums for type-safe status fields.

**When to use:** Match status, player status, team assignment, group roles.

**Example:**
```typescript
// src/db/schema.ts
import { pgTable, pgEnum, uuid, text, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";

// Define enums
export const matchStatusEnum = pgEnum("match_status", [
  "draft", "open", "full", "locked", "played", "rated"
]);

export const playerStatusEnum = pgEnum("player_status", [
  "confirmed", "waitlisted", "cancelled", "no_show"
]);

export const teamEnum = pgEnum("team", ["A", "B"]);

export const recurrenceEnum = pgEnum("recurrence", ["none", "weekly"]);

// IMPORTANT: Per CONTEXT.md, use captain/manager/player (not organizer/player)
export const groupRoleEnum = pgEnum("group_role", ["captain", "manager", "player"]);

// Users table (better-auth will add its own tables)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Full schema continues with matches, match_players, groups, etc.
```

### Pattern 4: PWA Manifest (Next.js Native)

**What:** Create dynamic PWA manifest using Next.js App Router.

**When to use:** PWA configuration without external libraries.

**Example:**
```typescript
// src/app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "kickoff",
    short_name: "kickoff",
    description: "Organise tes matchs de foot",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2D5016",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

### Pattern 5: Tailwind v4 CSS Configuration

**What:** Configure Tailwind v4 with CSS-first approach for shadcn/ui.

**When to use:** All styling in this project.

**Example:**
```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
  --primary: hsl(120 60% 21%); /* #2D5016 */
  --primary-foreground: hsl(0 0% 100%);
  --accent: hsl(142 69% 58%); /* #4ADE80 */
  --accent-foreground: hsl(0 0% 3.9%);
  /* ... other shadcn/ui variables */
}

.dark {
  --background: hsl(0 0% 3.9%);
  --foreground: hsl(0 0% 98%);
  /* ... dark mode variables */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
}
```

### Anti-Patterns to Avoid

- **Using next-pwa with Next.js 15+:** Causes "Webpack is configured while Turbopack is not" errors. Use native manifest.ts + manual service worker instead.
- **tailwind.config.js with Tailwind v4:** Configuration moved to CSS. Don't create JS config files.
- **Database sessions without cookie caching:** For JWT-like performance, enable `cookieCache` in better-auth.
- **Separate login and register pages on mobile:** Decision D-01 specifies tabs on single page for less navigation friction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom JWT/session handling | better-auth | Handles tokens, cookies, CSRF, password hashing |
| Password hashing | bcrypt/argon2 manually | better-auth built-in | Secure defaults, salt handling |
| Magic link tokens | Custom token generation | better-auth magic link plugin | Expiration, single-use, secure storage |
| Service worker caching | Complex Workbox config | Simple cache-first shell | PWA install is the goal, not offline-first |
| Form validation | Manual if/else checks | Zod schemas | Type inference, composable, reusable |
| UI components | Custom buttons/inputs | shadcn/ui | Accessible, tested, customizable |

**Key insight:** better-auth handles the entire auth surface (signup, signin, magic link, sessions, cookies) with a single configuration. Do not implement custom auth logic.

## Common Pitfalls

### Pitfall 1: better-auth Schema Mismatch

**What goes wrong:** Drizzle schema doesn't match better-auth's expected tables (user, session, account, verification).

**Why it happens:** better-auth requires specific table structures; custom schemas may conflict.

**How to avoid:**
1. Run `npx auth@latest generate` to create better-auth schema
2. Then `npx drizzle-kit generate` for migrations
3. Pass schema to drizzleAdapter with table mapping if using custom names

**Warning signs:** "Cannot read property 'user' of undefined" errors.

### Pitfall 2: Tailwind v4 Class Deprecations

**What goes wrong:** Old Tailwind classes don't work (e.g., `ring-offset-*`).

**Why it happens:** Tailwind v4 deprecated some utilities and changed syntax.

**How to avoid:** Run `npx @tailwindcss/upgrade@next` codemod on existing code; use `size-*` instead of `w-* h-*`.

**Warning signs:** Missing styles, classes not applying.

### Pitfall 3: Service Worker Turbopack Conflict

**What goes wrong:** "Webpack is configured while Turbopack is not" error when using next-pwa.

**Why it happens:** next-pwa uses Webpack plugins; Next.js 15+ uses Turbopack by default.

**How to avoid:** Use native `manifest.ts` + manual `public/sw.js` instead of next-pwa.

**Warning signs:** Build errors mentioning Webpack/Turbopack conflict.

### Pitfall 4: Remember Me Not Persisting

**What goes wrong:** Session expires after 7 days even when "remember me" is checked.

**Why it happens:** better-auth session refresh (updateAge) may not extend cookie properly in some configurations.

**How to avoid:**
1. Use database sessions (not pure stateless) for reliable expiry tracking
2. Configure `updateAge` to trigger refresh before expiry
3. Test with actual cookie inspection in DevTools

**Warning signs:** Users logged out unexpectedly after initial session period.

### Pitfall 5: Neon Cold Start on First Request

**What goes wrong:** First database request takes 500ms+ after inactivity.

**Why it happens:** Neon serverless has cold start latency.

**How to avoid:** Use `@neondatabase/serverless` with HTTP/2 pooling; accept first request may be slower.

**Warning signs:** Slow initial auth attempt after idle period.

## Code Examples

### Complete Auth API Route
```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

### Login Form with Tabs (Decision D-01)
```typescript
// src/components/auth/auth-tabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthTabs() {
  return (
    <Tabs defaultValue="login" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Connexion</TabsTrigger>
        <TabsTrigger value="register">Inscription</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      <TabsContent value="register">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
}
```

### Route Protection Middleware
```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isPublicRoute = request.nextUrl.pathname.startsWith("/m/");

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Service Worker (Minimal Caching)
```javascript
// public/sw.js
const CACHE_NAME = "kickoff-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  // Add CSS, fonts after build
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for API calls
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

### PWA Install Prompt (Decision D-10)
```typescript
// src/components/install-prompt.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  return (
    <div className="p-4 bg-primary/10 rounded-lg">
      {deferredPrompt ? (
        <Button onClick={handleInstall}>Installer kickoff</Button>
      ) : isIOS ? (
        <p className="text-sm">
          Pour installer, appuie sur le bouton partager puis "Sur l'ecran d'accueil"
        </p>
      ) : null}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-pwa for PWA | Native manifest.ts + sw.js | Next.js 15 (Fall 2024) | Avoids Turbopack conflicts |
| tailwind.config.js | CSS @theme directive | Tailwind v4 (Feb 2025) | Simpler config, native CSS |
| NextAuth.js | better-auth | 2024-2025 | Lighter, TypeScript-first |
| forwardRef in React | Named functions + data-slot | React 19 | Cleaner component code |
| HSL colors | OKLCH colors | shadcn/ui 2026 | Better color perception |

**Deprecated/outdated:**
- `next-pwa` v5.x: Still works but conflicts with Turbopack; use native approach
- `tailwindcss-animate`: Replaced by `tw-animate-css` in shadcn/ui
- `shadcn/ui` default style: Deprecated in favor of `new-york` style

## Open Questions

1. **Remember Me Cookie Extension**
   - What we know: better-auth supports `rememberMe` parameter, affects session duration
   - What's unclear: Exact mechanism for 7 vs 30 day toggle (may need custom session config)
   - Recommendation: Test with two session configurations or custom plugin

2. **Service Worker Cache Invalidation**
   - What we know: Manual sw.js needs version bumping for updates
   - What's unclear: Best strategy for cache busting without complex versioning
   - Recommendation: Use simple CACHE_NAME versioning; consider Serwist for Phase 10 if needed

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Check | 18+ required | -- |
| pnpm | Package manager | Check | 8+ | npm |
| PostgreSQL | Database | Neon cloud | 15+ | -- |

**Missing dependencies with no fallback:**
- None expected; all dependencies are npm packages or cloud services

**Missing dependencies with fallback:**
- pnpm: If not installed, can use `npm install -g pnpm`

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest) |
| Config file | None -- see Wave 0 |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test:ci` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can create account with email/password | integration | `pnpm test -- auth.test.ts` | Wave 0 |
| AUTH-02 | User can log in with email/password | integration | `pnpm test -- auth.test.ts` | Wave 0 |
| AUTH-03 | User can request magic link | integration | `pnpm test -- magic-link.test.ts` | Wave 0 |
| AUTH-04 | Session persists across refresh | e2e | Manual -- cookie inspection | Manual |
| PWA-01 | App installable as PWA | manual-only | Lighthouse PWA audit | Manual |
| PWA-02 | Service worker caches shell | manual-only | DevTools > Application | Manual |
| PWA-03 | Install prompt displays | manual-only | Mobile device test | Manual |
| PWA-04 | Works standalone | manual-only | Install and test | Manual |

### Sampling Rate
- **Per task commit:** `pnpm typecheck && pnpm build`
- **Per wave merge:** Full build verification
- **Phase gate:** All builds pass, Lighthouse PWA score >= 50

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration
- [ ] `tests/auth.test.ts` -- Auth flow tests (if testing desired Phase 1)
- [ ] Framework install: `pnpm add -D vitest @testing-library/react`

*(Testing infrastructure is optional for Phase 1; can defer to when team-balancer algorithm needs unit tests in Phase 3)*

## Sources

### Primary (HIGH confidence)
- [better-auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) -- Full adapter configuration
- [better-auth session management](https://better-auth.com/docs/concepts/session-management) -- Session duration, updateAge, rememberMe
- [better-auth magic link plugin](https://better-auth.com/docs/plugins/magic-link) -- Plugin configuration
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- Native manifest.ts, service worker
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) -- CSS configuration, @theme directive
- [Drizzle ORM PostgreSQL types](https://orm.drizzle.team/docs/column-types/pg) -- pgEnum, uuid, timestamp

### Secondary (MEDIUM confidence)
- [MakerKit better-auth setup](https://makerkit.dev/docs/nextjs-drizzle/better-auth/setup) -- Integration patterns verified
- [Medium: Next.js 15 PWA 2026](https://medium.com/@amirjld/how-to-implement-pwa-progressive-web-app-in-next-js-app-router-2026-f25a6797d5e6) -- Manual SW approach

### Tertiary (LOW confidence)
- next-pwa GitHub issues -- Turbopack compatibility concerns (needs validation per project)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm registry 2026-03-30
- Architecture: HIGH -- Patterns from official docs and proven projects
- Pitfalls: MEDIUM -- Some based on GitHub issues, may vary by configuration

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days -- stable technologies)
