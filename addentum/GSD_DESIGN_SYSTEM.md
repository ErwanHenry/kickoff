# GSD Addendum — Design System kickoff

> À insérer comme Phase 0 (avant toute tâche front) ou comme phase de retrofit si du front existe déjà.

---

## Fichiers à poser dans le repo

```
src/
├── components/icons/football-icons.tsx   # 12 pictos SVG football
├── lib/design-tokens.ts                  # Tokens couleurs, mapping icônes, badges statut
```
+ Merger tailwind-extend.ts dans tailwind.config.ts

---

## Règle à ajouter dans les conventions CLAUDE.md

```
### Design system
- Couleurs Tailwind : text-pitch, bg-chalk, bg-lime-glow, text-red-card, text-yellow-card, text-whistle-blue, bg-team-a, bg-team-b
- Fonts : font-sans (DM Sans) pour contenu/titres. font-mono (Space Mono) pour scores, stats, labels, timestamps
- Icônes métier : toujours <FootballIcon name="..." /> pour les concepts football. Lucide-react uniquement pour chevrons, X, menu, search, copy
- Badges statut : utiliser statusBadges de design-tokens.ts — jamais hardcoder
- Taux présence : utiliser attendanceBadge() pour le badge 🟢🟡🔴
- Background app : bg-chalk (#F8FAF5). Cards : bg-chalk-pure (blanc)
```

---

## Tâche GSD : Setup Design System

**Prompt Claude Code :**
```
Setup le design system kickoff. 

1. Google Fonts : ajoute DM Sans (300-700) et Space Mono (400,700) dans layout.tsx via next/font/google.

2. Tailwind config — merge ces extensions dans theme.extend :
   colors:
     pitch: { DEFAULT: "#2D5016", light: "#4A7A2E", dark: "#1A3009" }
     lime: { DEFAULT: "#4ADE80", glow: "#BBF7D0", dark: "#166534" }
     chalk: { DEFAULT: "#F8FAF5", pure: "#FFFFFF" }
     yellow-card: "#FACC15"
     red-card: "#EF4444"
     whistle-blue: "#3B82F6"
     team-a: "#2D5016"
     team-b: "#3B82F6"
   fontFamily: sans = ["DM Sans", "sans-serif"], mono = ["Space Mono", "monospace"]
   borderRadius: card = "16px", badge = "20px", button = "10px"
   boxShadow: card = "0 1px 3px rgba(0,0,0,0.06)", card-hover = "0 8px 24px rgba(0,0,0,0.12)"
   Background body = bg-chalk

3. Copie src/components/icons/football-icons.tsx (fourni dans le repo). Vérifie que <FootballIcon name="ball" size={24} className="text-pitch" /> rend un SVG vert.

4. Copie src/lib/design-tokens.ts (fourni dans le repo). Vérifie que statusBadges et attendanceBadge() sont importables.

5. Met à jour le layout.tsx : background bg-chalk, fonts DM Sans + Space Mono appliquées globalement.

6. Si des pages front existent déjà, NE PAS les modifier dans cette tâche. On fera un pass de retrofit séparé.
```

**Done when :** `text-pitch` rend du vert dans Tailwind, `<FootballIcon name="centerCircle" />` s'affiche, `font-mono` applique Space Mono, `pnpm build` passe.

---

## Tâche GSD : Retrofit Design System (si du front existe déjà)

**Prompt Claude Code :**
```
Applique le design system kickoff sur toutes les pages front existantes.

Règles de remplacement :
1. Remplace toutes les couleurs hardcodées (#2D5016, #4ADE80, etc.) par les classes Tailwind custom (text-pitch, bg-lime, bg-chalk, etc.)
2. Remplace les icônes lucide-react qui correspondent à des concepts football par <FootballIcon> :
   - Plus/PlusCircle pour créer un match → <FootballIcon name="centerCircle" />
   - Check/CheckCircle pour RSVP confirmé → <FootballIcon name="boot" />
   - Star pour rating → <FootballIcon name="star" />
   - Bell pour notifications → <FootballIcon name="whistle" />
   - Users/Group pour groupes → <FootballIcon name="cornerFlag" />
   - Clock pour deadline → <FootballIcon name="chrono" />
   - Trophy pour leaderboard → <FootballIcon name="star" />
   - AlertTriangle pour warning → <FootballIcon name="card" /> avec text-yellow-card
   - Garder lucide-react pour : ChevronLeft, ChevronRight, X, Menu, Search, Copy, ExternalLink, MoreVertical
3. Remplace les badges de statut hardcodés par statusBadges de design-tokens.ts
4. Remplace les badges de taux de présence par attendanceBadge()
5. Applique font-mono sur : scores (3-2), stats (4.2/5), compteurs (8/14), timestamps (Mar 15 avr), labels uppercase (CONFIRMÉ, ÉQUIPE A)
6. Applique font-sans sur tout le reste (titres, body, descriptions)
7. Background body → bg-chalk. Cards → bg-chalk-pure avec shadow-card

Ne casse pas les fonctionnalités existantes. Chaque page doit garder le même comportement.
```

**Done when :** toutes les pages utilisent les pictos football, les couleurs custom, et les deux fonts. Aucune couleur hex hardcodée dans les composants. `pnpm build` passe.
