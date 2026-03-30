# Testing Guide: Post-Match Closure Feature

Complete guide to test the new match closure feature at `/match/[id]/attendance`.

---

## Quick Start (5 minutes)

```bash
# 1. Start the dev server
pnpm dev

# 2. Open your browser
open http://localhost:3000
```

Then follow the steps below.

---

## Complete Testing Flow

### Step 1: Create an Account / Login (2 min)

1. **Go to:** http://localhost:3000/login
2. **Click:** "S'inscrire" tab
3. **Fill form:**
   - Nom: `Test User` (or any name)
   - Email: `test@example.com` (or any email)
   - Password: `password123` (min 8 characters)
4. **Click:** "S'inscrire"
5. **You're redirected to:** Dashboard

> **Note:** This uses better-auth with email/password. No email confirmation required in dev mode.

---

### Step 2: Create a Match (2 min)

1. **On Dashboard:** Click "Nouveau match" button (top right)
2. **Fill the form:**
   - Titre (optional): `Test Match`
   - Lieu: `UrbanSoccer Nice`
   - Date: Pick today's date
   - Heure: Pick a time (e.g., 20:00)
   - Nombre de joueurs max: `10` (or any number)
   - Deadline (optional): Leave empty for now
3. **Click:** "Créer le match"
4. **You're redirected to:** Dashboard

Your new match should appear in the "Prochain match" section.

---

### Step 3: Add Test Players (Simulated)

**Important:** You need confirmed players to test attendance marking. You have two options:

#### Option A: Use the Share Link (Recommended for testing)

1. **On Dashboard:** Find your match and click on it
2. **Copy the share link** (or note the share token from URL)
3. **Open in incognito/private window:** http://localhost:3000/m/{shareToken}
4. **Add guest players:**
   - Enter player name: "Player 1"
   - Click "Je suis là !"
   - Repeat for "Player 2", "Player 3", etc.
5. **Add 4-6 players** total

#### Option B: Quick Database Insert (Fastest)

Run this SQL in your Neon database console:

```sql
-- Get your match ID first from dashboard URL or database
SELECT id, share_token FROM matches ORDER BY created_at DESC LIMIT 1;

-- Replace YOUR_MATCH_ID with the actual UUID
INSERT INTO match_players (id, match_id, guest_name, status, confirmed_at)
VALUES
  (gen_random_uuid(), 'YOUR_MATCH_ID', 'Player 1', 'confirmed', NOW()),
  (gen_random_uuid(), 'YOUR_MATCH_ID', 'Player 2', 'confirmed', NOW()),
  (gen_random_uuid(), 'YOUR_MATCH_ID', 'Player 3', 'confirmed', NOW()),
  (gen_random_uuid(), 'YOUR_MATCH_ID', 'Player 4', 'confirmed', NOW()),
  (gen_random_uuid(), 'YOUR_MATCH_ID', 'Player 5', 'confirmed', NOW()),
  (gen_random_uuid(), 'YOUR_MATCH_ID', 'Player 6', 'confirmed', NOW());
```

---

### Step 4: Generate Teams (Required Step)

**Before you can close a match, you need to generate teams first:**

1. **Go to:** http://localhost:3000/match/{matchId}/teams
   - Replace `{matchId}` with your match UUID (from dashboard URL)
2. **Click:** "Générer les équipes" button
3. **Wait:** Teams are generated and match status changes to "locked"

> **Why?** The attendance form only works with "locked" matches (after teams are generated).

---

### Step 5: Test the Attendance Closure (The Main Feature!)

1. **Go to:** http://localhost:3000/match/{matchId}/attendance
   - You should see the "Clôture du match" page
   - All players should be listed (grouped by team)
   - All players marked as "Present" by default (switches ON)

2. **Test the UI:**
   - ✅ Verify player avatars show initials
   - ✅ Verify team badges (A or B)
   - ✅ Toggle some players OFF (should show strikethrough + warning)
   - ✅ Click "Tous présents" to reset
   - ✅ Check progress indicator updates: "X/Y joueurs marqués"

3. **Enter Score:**
   - Score Team A: `3`
   - Score Team B: `2`
   - Verify inputs accept 0-99

4. **Add Summary (Optional):**
   - Type in textarea: "Great match! Player 1 was MVP."
   - Verify character counter shows length/500

5. **Submit:**
   - Click "Clôturer le match"
   - **Should show:** Confirmation dialog with warning about absent players
   - Click "Oui, clôturer"
   - **Should show:** Loading state "Clôture en cours..."
   - **Should redirect to:** Match detail page
   - **Should show toast:** "Match clôturé ! Les joueurs peuvent maintenant noter leurs coéquipiers."

---

### Step 6: Verify Database Updates

Run this SQL in your Neon console:

```sql
-- Check match status
SELECT id, status, score_team_a, score_team_b, match_summary
FROM matches
WHERE id = 'YOUR_MATCH_ID';

-- Should show:
-- status: 'played'
-- score_team_a: 3
-- score_team_b: 2
-- match_summary: 'Great match! Player 1 was MVP.'

-- Check player attendance
SELECT
  mp.guest_name,
  mp.status,
  mp.attended,
  mp.team
FROM match_players mp
WHERE mp.match_id = 'YOUR_MATCH_ID'
ORDER BY mp.team, mp.guest_name;

-- Should show:
-- status: 'confirmed' for present players
-- status: 'no_show' for absent players
-- attended: true/false based on your marking
-- team: 'A' or 'B'
```

---

## Edge Cases to Test

### Test 1: Permission Check
1. **Create a second account** (different email)
2. **Login with second account**
3. **Try to access:** /match/{matchId}/attendance
4. **Should see:** "Accès non autorisé" (only creator can close)

### Test 2: Validation
1. **Go to:** /match/{matchId}/attendance (with a locked match you created)
2. **Don't enter score**
3. **Try to submit** → Button should be disabled
4. **Enter score but don't mark all players**
5. **Try to submit** → Button should be disabled

### Test 3: Already Played
1. **Close a match** (follow steps above)
2. **Try to access:** /match/{matchId}/attendance again
3. **Should see:** "Match déjà clôturé" warning

### Test 4: Unauthenticated Access
1. **Logout** (click avatar → Déconnexion)
2. **Try to access:** /match/{matchId}/attendance
3. **Should redirect to:** /login

---

## Mobile Testing

Test on a mobile viewport or real device:

1. **Open Chrome DevTools** (F12)
2. **Toggle device toolbar** (Cmd+Shift+M on Mac)
3. **Select:** iPhone SE (375px) or iPhone 14 (390px)
4. **Verify:**
   - ✅ Touch targets are 44x44px minimum
   - ✅ Single column layout
   - ✅ Sticky submit button at bottom
   - ✅ Safe area insets for notched devices
   - ✅ Score inputs stack correctly on small screens

---

## Quick Reset for Repeated Testing

To test multiple times, you can either:

### Option A: Create New Matches
Just create more matches from the dashboard.

### Option B: Reset Match Status

Run this SQL to reopen a closed match:

```sql
UPDATE matches
SET status = 'locked',
    score_team_a = NULL,
    score_team_b = NULL,
    match_summary = NULL
WHERE id = 'YOUR_MATCH_ID';

UPDATE match_players
SET attended = NULL,
    status = 'confirmed'
WHERE match_id = 'YOUR_MATCH_ID';
```

---

## Troubleshooting

### "Match non trouvé" error
- **Cause:** Invalid match ID in URL
- **Fix:** Copy the match ID from dashboard or database

### "Accès non autorisé" error
- **Cause:** You're not logged in as the match creator
- **Fix:** Login with the correct account

### No players showing in attendance list
- **Cause:** Match has no confirmed players
- **Fix:** Add players via share link or database insert

### Can't access /match/{id}/attendance
- **Cause:** Teams not generated yet (match not "locked")
- **Fix:** Go to /match/{id}/teams and generate teams first

---

## Success Criteria Checklist

When testing, verify all of these work:

- [ ] Login works with email/password
- [ ] Can create a new match
- [ ] Can add players (via share link)
- [ ] Can generate teams
- [ ] Attendance page loads for match creator
- [ ] All players displayed with toggle switches
- [ ] All players marked present by default
- [ ] Can toggle players absent (visual feedback)
- [ ] "Tous présents" button works
- [ ] Progress indicator updates
- [ ] Score inputs accept 0-99
- [ ] Summary textarea has character counter
- [ ] Submit button disabled until valid
- [ ] Confirmation dialog shows
- [ ] Loading state during submission
- [ ] Redirect to match detail after success
- [ ] Toast notification appears
- [ ] Database: match status = "played"
- [ ] Database: scores saved correctly
- [ ] Database: attendance saved correctly
- [ ] Database: absent players have "no_show" status
- [ ] Permission checks work (non-creator blocked)
- [ ] Mobile layout works correctly

---

## Files Modified/Created

Reference the implementation:

- **Created:** `src/lib/actions/close-match.ts` - Server action
- **Created:** `src/components/match/attendance-form.tsx` - Form component
- **Created:** `src/app/match/[id]/attendance/page.tsx` - Page route
- **Modified:** `src/lib/validations/match.ts` - Added matchCloseSchema
- **Modified:** `src/lib/db/queries/matches.ts` - Added getConfirmedPlayersForAttendance

---

**Happy testing! 🎉**

If you find any bugs or issues, please describe them and I'll fix them.
