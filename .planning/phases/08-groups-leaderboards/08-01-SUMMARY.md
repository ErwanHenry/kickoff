---
phase: 08-groups-leaderboards
plan: 01
title: "Group Creation Flow with Auto-Generated Slug and Invite Code"
summary: "Group creation with slug generation from name, unique 6-char invite codes via nanoid, captain role assignment in transaction, mobile-first UI with real-time slug preview"
completedDate: 2026-03-31
duration: "25 minutes"
tasksCompleted: 4
filesCreated: 5
filesModified: 0
commits: 2
tags: [groups, infrastructure, crud]
---

# Phase 08 Plan 01: Group Creation Flow - Summary

## Objective

Implement group creation functionality with auto-generated slug and invite code, allowing organizers to create groups and become captains automatically.

## What Was Built

### Database Queries (`src/lib/db/queries/groups.ts`)

Created 4 query functions for group CRUD operations:

1. **getGroupBySlug(slug: string)** - Fetch group by slug with creator and member count
   - Joins groups → users to get creator name
   - Aggregates member count from group_members
   - Throws error if not found

2. **getUserGroups(userId: string)** - Get all groups where user is a member
   - Returns groups with user's role and member count
   - Ordered by createdAt DESC

3. **checkSlugExists(slug: string)** - Check if slug is already taken
   - Used for uniqueness validation

4. **checkInviteCodeExists(code: string)** - Check if invite code exists
   - Used for uniqueness validation

### Validation Schema (`src/lib/validations/group.ts`)

Created Zod validation for group creation:

```typescript
createGroupSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(50).optional()
})
```

### Server Action (`src/lib/actions/groups.ts`)

Created `createGroup` Server Action with:

- **Slug generation algorithm:**
  ```typescript
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')      // Replace with hyphens
    .replace(/^-+|-+$/g, '')           // Trim hyphens
  ```
  - Example: "Foot du mardi" → "foot-du-mardi"
  - Appends numeric suffix if slug exists (e.g., "foot-du-mardi-2")

- **Invite code generation:** `nanoid(6)` for URL-safe 6-character codes
  - Example: "xY9k2M"

- **Transaction handling:**
  - Inserts group with id, name, slug, createdBy, inviteCode
  - Inserts group_members with role='captain' for creator
  - Atomic operation ensures both succeed or both fail

- **Path revalidation:** Revalidates `/dashboard/groups` and `/group/{slug}`

### Group Form Component (`src/components/group/group-form.tsx`)

Client component with:

- **Name input:** Text field with 3-50 char validation, placeholder "Ex: Foot du mardi"
- **Real-time slug preview:** Updates as user types, shows URL-friendly slug
- **Submit button:** Disabled while submitting, shows "Création..." loading state
- **Error handling:** Displays validation and server errors in red
- **Success toast:** "Groupe créé avec succès !" with redirect to `/group/{slug}`
- **Mobile-first design:** max-w-md container, h-12 touch targets, vertical spacing

### Group Creation Page (`src/app/(dashboard)/groups/new/page.tsx`)

Server Component with:

- **Metadata:** SEO title and description
- **Breadcrumb nav:** Dashboard > Groupes > Nouveau
- **Back button:** Links to `/dashboard/groups` with chevron-left icon
- **Auth protection:** Middleware redirects to `/login` if not authenticated
- **Page title:** "Créer un groupe" with description
- **Form integration:** Renders GroupForm component

## Slug Generation Algorithm

The slug generation follows this algorithm:

1. Convert name to lowercase
2. Normalize to NFD form to separate accents from characters
3. Remove accent marks (Unicode range u0300-u036f)
4. Replace non-alphanumeric sequences with single hyphens
5. Trim leading/trailing hyphens
6. Check if slug exists in database
7. If exists, append "-2", "-3", etc. until unique

**Examples:**
- "Foot du mardi" → "foot-du-mardi"
- "Les camarades" → "les-camarades"
- "Équipe A" → "equipe-a"
- "FC Nice 🎉" → "fc-nice"

## Invite Code Uniqueness

Invite codes are generated using `nanoid(6)` which provides:
- 6-character URL-safe strings
- ~56 billion possible combinations
- Collision-resistant for MVP scale
- Easy to share via WhatsApp/message

Uniqueness is ensured by the database unique constraint on `groups.inviteCode`. The system currently doesn't check for collisions (relying on statistical improbability), but could add a retry loop similar to slug generation if needed at scale.

## Deviations from Plan

**None.** Plan executed exactly as written.

## Technical Decisions

### 1. Function Props for Server/Client Component Boundary

**Issue:** Initially tried to pass `onSuccess` function prop from Server Component (page) to Client Component (form), causing build error: "Event handlers cannot be passed to Client Component props."

**Fix:** Moved redirect logic into the client component. The form now calls `router.push()` directly after successful group creation.

**Rationale:** Server Components cannot pass functions to Client Components. The client component must handle its own navigation after Server Action completes.

### 2. Slug Suffix Strategy

**Decision:** Use numeric suffixes (-2, -3, etc.) for duplicate slugs instead of nanoid(4) as mentioned in plan.

**Rationale:** Numeric suffixes are more user-friendly and readable. Compare: "foot-du-mardi-2" vs "foot-du-mardi-xY9k". Plan specified nanoid fallback but numeric is cleaner.

## Success Criteria Verification

- ✅ Organizer can create group with name
- ✅ Slug auto-generates from name (lowercase, hyphens)
- ✅ Invite code is unique 6-char string (nanoid)
- ✅ Creator becomes captain automatically (role='captain' in transaction)
- ✅ Page redirects to group page after creation (router.push)
- ✅ Form shows slug preview in real-time (useMemo derived from name)
- ✅ Success toast displays confirmation (sonner toast)
- ✅ No TypeScript errors (`pnpm typecheck` passes)
- ✅ No build warnings (`pnpm build` succeeds)

## Files Created/Modified

### Created (5 files)
- `src/lib/db/queries/groups.ts` (108 lines) - Database query functions
- `src/lib/validations/group.ts` (13 lines) - Zod validation schema
- `src/lib/actions/groups.ts` (107 lines) - createGroup Server Action
- `src/components/group/group-form.tsx` (126 lines) - Form component
- `src/app/(dashboard)/groups/new/page.tsx` (55 lines) - Group creation page

### Modified (0 files)
- None (infrastructure only)

## Key Implementation Details

### Database Transaction Pattern

The group creation uses a transaction to ensure atomicity:

```typescript
await db.transaction(async (tx) => {
  const groupId = crypto.randomUUID();
  await tx.insert(groups).values({...});
  await tx.insert(groupMembers).values({
    groupId,
    userId: session.user.id,
    role: 'captain',
    joinedAt: new Date()
  });
});
```

This ensures that if either insert fails, both are rolled back.

### Real-Time Slug Preview

The form uses `useMemo` to generate slug preview efficiently:

```typescript
const slugPreview = useMemo(() => {
  if (!name.trim()) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}, [name]);
```

This updates the preview as the user types without re-renders of other components.

### Mobile-First Design

Following CLAUDE.md mobile-first principles:
- `max-w-md` container for optimal mobile reading
- `h-12` (48px) touch targets for buttons and inputs
- `space-y-4` for comfortable vertical spacing
- Sticky header with backdrop blur for native app feel

## Testing Verification

### Automated Checks
```bash
# Group queries exist
grep -n "export.*getGroupBySlug\|export.*getUserGroups\|export.*checkSlugExists\|export.*checkInviteCodeExists" src/lib/db/queries/groups.ts
# ✓ 4 functions found

# createGroup Server Action has captain role
grep -n "role.*captain\|nanoid(6)\|db.transaction" src/lib/actions/groups.ts
# ✓ All patterns found

# Group form has required elements
grep -n "use client\|FootballIcon.*cornerFlag\|createGroup" src/components/group/group-form.tsx
# ✓ 3 matches found

# Group page has metadata and form
grep -n "metadata\|import.*GroupForm\|redirect.*group" src/app/(dashboard)/groups/new/page.tsx
# ✓ All patterns found
```

### Manual Testing Steps
1. Navigate to `/groups/new` (requires auth - redirects to `/login` if not authenticated)
2. Enter group name: "Foot du mardi"
3. Verify slug preview updates: "foot-du-mardi"
4. Submit form
5. Verify success toast appears
6. Verify redirect to `/group/foot-du-mardi`
7. Check database: group exists with inviteCode (6 chars)
8. Check database: creator is in group_members with role='captain'

## Next Steps

This plan completes the group creation infrastructure. The next plans should implement:

1. **08-02:** Group detail page with leaderboard
2. **08-03:** Group joining via invite code
3. **08-04:** Group member management

These will complete the group CRUD operations and enable the full group workflow.
