# Phase 1: Foundation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Project setup with database schema, authentication, and PWA configuration — the technical infrastructure that enables all subsequent features.

**Requirements covered:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, PWA-01, PWA-02, PWA-03, PWA-04

</domain>

<decisions>
## Implementation Decisions

### Auth UX

- **D-01:** Single page with tabs at `/login` — "Connexion" and "Inscription" tabs on one page, less navigation friction on mobile
- **D-02:** Email/password is the primary login method — magic link appears as secondary option ("Connexion sans mot de passe") below the password field
- **D-03:** Form validation uses both inline errors per field AND summary toast — maximum visibility for users
- **D-04:** "Se souvenir de moi" checkbox extends session from 7 days to 30 days — good for regular players on personal devices
- **D-05:** Single flexible "Nom" field for registration — accepts first name, nickname, full name, or pseudo. No format validation. Label: "Nom" or "Comment tu t'appelles ?"
- **D-06:** Post-auth redirect to `/dashboard` for Phase 1 — user type-specific routing is a Phase 2+ concern

### Landing Page

- **D-07:** Hero with problem + solution headline — "Fini le bordel sur WhatsApp. Crée ton match, partage le lien." (or similar)
- **D-08:** 3 feature icons below hero — quick value props: Inviter, Équilibrer, Noter
- **D-09:** Primary CTA: "C'est parti !" → `/login`

### PWA Behavior

- **D-10:** Install prompt appears after login/register — user has committed to an account, good engagement moment
- **D-11:** Offline mode shows cached pages with "Hors ligne" banner — actions disabled, but user can browse previously visited content
- **D-12:** Splash screen: "kickoff" logo/text on #2D5016 (vert terrain) background — clean, fast load feel
- **D-13:** Display mode: standalone — full-screen app experience, no browser chrome
- **D-14:** App icon: football/soccer ball on #2D5016 green background — recognizable, on-theme
- **D-15:** Push notifications deferred to Phase 10 — keep Phase 1 simple, email notifications come later

### Claude's Discretion

- Error message copy and tone (French, casual but clear)
- Exact spacing/layout within the decided structure
- Animation/transition details for tab switching
- Service worker caching strategy details (cache-first for shell, network-first for API)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & Requirements
- `DESIGN_DOC.md` — Full MVP design doc with schema (§4.2), routes (§4.3), and UX principles (§7)
- `CLAUDE.md` — Project conventions, commands, and folder structure
- `.planning/REQUIREMENTS.md` — All v1 requirements with phase mapping

### Stack Documentation
- `.planning/research/STACK.md` — Technology choices and configuration patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project
- shadcn/ui components will be added during init (button, input, card, dialog, badge, avatar, dropdown-menu, toast, tabs, separator)

### Established Patterns
- From CLAUDE.md: Server Components by default, `"use client"` only if interactivity
- From CLAUDE.md: TypeScript strict, zero `any`
- From CLAUDE.md: Dates UTC (ISO 8601), IDs uuid, share_token nanoid 10 chars
- From CLAUDE.md: Colors: `#2D5016` (vert terrain), `#4ADE80` (accent), white, black

### Integration Points
- better-auth with Drizzle adapter (proven on Alignd project)
- Neon serverless PostgreSQL connection
- Resend for magic link emails

</code_context>

<specifics>
## Specific Ideas

### User Roles System (Important for Schema Design)

The user defined a detailed role system that affects the schema:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Captain** | Group creator (like a coach) | Full control: hire/fire managers, delete any match, approve player invitations, decide team composition |
| **Manager** | 1-2 players invited by Captain | Same permissions as Captain (co-management) |
| **Player** | Standard members | Create matches (own deletable by Captain), rate other players, propose inviting new players |

**Key Rules:**
- Everyone can create a match
- Captain/Manager can delete anyone's match
- Players rate *each other* (not themselves, not the game itself)
- Player invitations need Captain/Manager approval
- New player requests can be for one match (guest) or long-term (group member)
- Democratic override: >50% of players can trigger Captain election
- Team composition (Captain + Managers decide): who starts, format (5v5, 7v7, 11v11)

**Schema implication:** The `group_members.role` enum should be `captain | manager | player` (not just `organizer | player` as in original DESIGN_DOC.md)

</specifics>

<deferred>
## Deferred Ideas

### User Types & Routing (Phase 2+)
User wants different flows for different user types (Captain vs Player). For Phase 1, everyone goes to `/dashboard` after login. Refined routing comes when dashboard and match creation exist.

### Full Role Permissions (Phase 8)
The Captain/Manager/Player system is captured above but implementation happens in Phase 8 (Groups & Leaderboards). Phase 1 just needs the schema to support it.

### Democratic Captain Vote (Future)
The >50% vote mechanism for Captain elections is noted but not in current v1 roadmap. Could be Phase 8+ or v2.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-30*
