# CLAUDE.md — kickoff

> App web (PWA) pour organiser des matchs de foot entre potes.
> Créer → Inviter → Confirmer → Équilibrer → Jouer → Noter.

## Règles absolues

1. **Pas de feature creep.** Si c'est pas dans ce fichier ou dans `DESIGN_DOC.md`, on ne le fait pas.
2. **Le flow guest (sans compte) est la porte d'entrée.** RSVP en 1 tap via lien WhatsApp, zéro friction.
3. **Le compte joueur est le produit.** Historique, stats, profil = raison de s'inscrire.
4. **Mobile-first.** Si ça marche pas sur iPhone SE, c'est cassé.
5. **Merge guest → user = critique.** Un guest qui crée un compte retrouve TOUT son historique.
6. **Chaque tâche GSD est autonome.** Contexte frais à chaque fois, pas de dépendance implicite.
7. **Toujours vérifier que ça compile** avant de considérer une tâche terminée : `pnpm build && pnpm typecheck`.

## Stack

| Quoi | Choix | Pourquoi |
|------|-------|----------|
| Framework | Next.js 15, App Router | SSR pour liens WhatsApp, Server Components |
| DB | Neon (PostgreSQL serverless) | Multi-user concurrent, free tier 0.5 GB |
| ORM | Drizzle ORM | Type-safe, léger, bon support PostgreSQL |
| Auth | better-auth | Magic link + email/password |
| CSS | Tailwind CSS v4 | Rapidité |
| UI | shadcn/ui | Composants accessibles |
| Email | Resend | Free tier 3K/mois |
| Hosting | Vercel | Edge rendering, preview deploys |
| Format | PWA | Installable, pas d'app store |

## Commandes

```bash
pnpm dev                    # Dev server
pnpm build                  # Build prod
pnpm typecheck              # TS check
pnpm lint                   # Lint
pnpm db:generate            # Générer migrations Drizzle
pnpm db:migrate             # Appliquer migrations
pnpm db:seed                # Seed données de test
pnpm db:studio              # Drizzle Studio
vercel                      # Deploy preview
vercel --prod               # Deploy prod
```

## Conventions

- TypeScript strict, zéro `any`
- Server Components par défaut, `"use client"` seulement si interactivité
- Fichiers : kebab-case. Types : PascalCase. Fonctions : camelCase
- Pas de barrel exports
- Drizzle query builders, pas de SQL brut
- Dates UTC (ISO 8601), IDs uuid (`crypto.randomUUID()`), share_token nanoid 10 chars
- Validation inputs : Zod
- API responses : `{ data, error, message }`
- Couleurs : vert terrain `#2D5016`, blanc, noir, accent `#4ADE80`

## Variables d'environnement

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/kickoff?sslmode=require
BETTER_AUTH_SECRET=<random-32-chars>
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@kickoff.app
```

## Structure cible

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (dashboard)/page.tsx              # Dashboard organisateur
│   ├── (dashboard)/matches/page.tsx      # Mes matchs
│   ├── (dashboard)/groups/page.tsx       # Mes groupes
│   ├── m/[shareToken]/page.tsx           # RSVP public (sans compte)
│   ├── m/[shareToken]/rate/page.tsx      # Notation post-match (guest)
│   ├── match/[id]/page.tsx               # Détail match (organisateur)
│   ├── match/[id]/teams/page.tsx         # Équipes générées
│   ├── match/[id]/attendance/page.tsx    # Fiche de présence post-match
│   ├── match/[id]/rate/page.tsx          # Notation (connecté)
│   ├── player/[id]/page.tsx              # Profil joueur (fiche scouting)
│   ├── group/[slug]/page.tsx             # Groupe + leaderboard
│   ├── group/[slug]/matches/page.tsx     # Historique matchs du groupe
│   ├── api/matches/route.ts
│   ├── api/rsvp/route.ts
│   ├── api/teams/route.ts
│   ├── api/ratings/route.ts
│   ├── api/groups/route.ts
│   ├── api/players/route.ts
│   ├── manifest.ts                       # PWA manifest dynamique
│   ├── layout.tsx
│   └── page.tsx                          # Landing
├── components/
│   ├── ui/                               # shadcn/ui
│   ├── match/
│   │   ├── match-card.tsx
│   │   ├── match-form.tsx
│   │   ├── rsvp-button.tsx
│   │   ├── player-list.tsx
│   │   ├── attendance-form.tsx           # Fiche de présence
│   │   └── team-reveal.tsx
│   ├── rating/
│   │   ├── rating-form.tsx
│   │   ├── star-input.tsx
│   │   └── player-rating-card.tsx
│   ├── player/
│   │   ├── player-profile.tsx
│   │   ├── stats-overview.tsx
│   │   ├── radar-chart.tsx               # Graphique radar tech/phys/coll
│   │   ├── match-history.tsx
│   │   └── comments-list.tsx
│   ├── group/
│   │   ├── leaderboard.tsx
│   │   └── group-card.tsx
│   └── layout/
│       ├── header.tsx
│       └── mobile-nav.tsx
├── db/
│   ├── schema.ts
│   ├── index.ts                          # Neon serverless connection
│   ├── migrations/
│   └── seed.ts
├── lib/
│   ├── auth.ts
│   ├── team-balancer.ts
│   ├── stats.ts                          # Calcul player_stats
│   ├── notifications.ts
│   ├── og.ts
│   └── utils.ts
└── types/index.ts
```

---

## GSD — Phases & Tâches atomiques

Chaque tâche est autonome. Copie le prompt dans Claude Code, il a tout le contexte nécessaire.

---

### PHASE 1 — Fondations

#### Tâche 1.1 : Init projet

**Prompt Claude Code :**
```
Initialise un projet Next.js 15 avec App Router, TypeScript strict, Tailwind CSS v4, et pnpm. Ajoute shadcn/ui avec les composants : button, input, card, dialog, badge, avatar, dropdown-menu, toast, tabs, separator. Configure le tsconfig en strict. Crée le layout.tsx racine avec les metadata de base (title: "kickoff", description: "Organise tes matchs de foot"). Crée une landing page minimaliste avec un h1 "kickoff" et un CTA "Créer un match". Mobile-first, couleur primaire #2D5016, accent #4ADE80.
```

**Done when :** `pnpm dev` démarre, la landing s'affiche sur mobile, `pnpm typecheck` passe.

---

#### Tâche 1.2 : Database schema + Neon

**Prompt Claude Code :**
```
Installe drizzle-orm, @neondatabase/serverless, et drizzle-kit. Configure drizzle.config.ts pour PostgreSQL Neon. Crée src/db/index.ts avec la connection Neon serverless (neon() + drizzle()). Crée src/db/schema.ts avec TOUTES ces tables :

users: id (uuid PK default gen_random_uuid()), email (unique nullable), name (text not null), phone (text nullable), password_hash (text nullable), created_at (timestamp default now()), updated_at (timestamp default now())

groups: id (uuid PK), name, slug (unique), created_by → users, invite_code (unique), created_at, updated_at

group_members: group_id → groups, user_id → users, role (enum: organizer | player), joined_at. PK(group_id, user_id)

matches: id (uuid PK), group_id → groups (nullable), created_by → users, title (nullable), location (text), date (timestamp), max_players (int), min_players (int default 10), status (enum: draft | open | full | locked | played | rated), deadline (timestamp nullable), recurrence (enum: none | weekly), parent_match_id (uuid nullable self-ref), match_summary (text nullable), score_team_a (int nullable), score_team_b (int nullable), share_token (unique text), created_at, updated_at

match_players: id (uuid PK), match_id → matches, user_id → users (nullable pour guests), status (enum: confirmed | waitlisted | cancelled | no_show), team (enum nullable: A | B), guest_name (text nullable), guest_token (text nullable unique), attended (boolean nullable), confirmed_at, cancelled_at

ratings: id (uuid PK), match_id → matches, rater_id (text not null), rated_id (text not null), technique (int check 1-5), physique (int check 1-5), collectif (int check 1-5), comment (text nullable), created_at. UNIQUE(match_id, rater_id, rated_id)

player_stats: id (uuid PK), user_id → users, group_id → groups (nullable), matches_played (int default 0), matches_confirmed (int default 0), matches_attended (int default 0), matches_no_show (int default 0), attendance_rate (decimal default 0), avg_technique (decimal default 3), avg_physique (decimal default 3), avg_collectif (decimal default 3), avg_overall (decimal default 3), total_ratings_received (int default 0), last_match_date (timestamp nullable), last_updated (timestamp default now()). UNIQUE(user_id, group_id)

Ajoute les scripts pnpm : db:generate, db:migrate, db:studio. Génère la première migration. Vérifie que pnpm db:generate passe sans erreur.
```

**Done when :** `pnpm db:generate` réussit, migration créée dans `src/db/migrations/`.

---

#### Tâche 1.3 : Auth (better-auth)

**Prompt Claude Code :**
```
Installe better-auth. Configure src/lib/auth.ts avec :
- Provider email/password
- Provider magic link (via Resend, variable RESEND_API_KEY)
- Adapter Drizzle PostgreSQL (utilise la connection Neon existante dans src/db/index.ts)
- Session strategy : JWT

Crée les API routes auth dans src/app/api/auth/[...all]/route.ts.
Crée src/app/(auth)/login/page.tsx : formulaire email + password, lien "Connexion par magic link", lien vers register. Mobile-first, shadcn/ui.
Crée src/app/(auth)/register/page.tsx : formulaire nom + email + password. Après inscription, redirect vers /dashboard.
Crée un middleware.ts qui protège les routes (dashboard)/* et redirige vers /login si pas connecté. Les routes /m/* sont publiques.
```

**Done when :** inscription + connexion email/password fonctionnent. Les routes `/m/*` restent accessibles sans compte.

---

#### Tâche 1.4 : PWA + Vercel config

**Prompt Claude Code :**
```
Crée src/app/manifest.ts qui retourne un web app manifest dynamique : name "kickoff", short_name "kickoff", start_url "/dashboard", display "standalone", background_color "#ffffff", theme_color "#2D5016", icônes placeholder 192x192 et 512x512 (génère des SVG simples vert avec un ballon).

Crée public/sw.js — service worker minimal : cache la app shell (layout, CSS, fonts) en install, network-first pour les API calls.

Crée vercel.json avec les headers Content-Security-Policy et X-Content-Type-Options basiques.

Ajoute les meta tags PWA dans layout.tsx : apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, theme-color, lien manifest.
```

**Done when :** Chrome DevTools > Application > Manifest affiche les infos correctement. Le bouton "Installer" apparaît sur mobile.

---

#### Tâche 1.5 : Seed script

**Prompt Claude Code :**
```
Crée src/db/seed.ts et le script pnpm db:seed qui :
1. Crée 1 organisateur : Erwan, erwan@test.com, password "test1234"
2. Crée 14 joueurs avec des noms français réalistes (Karim, Lucas, Mehdi, Antoine, Youssef, Théo, Romain, Hugo, Bilal, Maxime, Sofiane, Jordan, Thomas, Nabil), emails en @test.com, passwords "test1234"
3. Crée 1 groupe "Foot du mardi", slug "foot-du-mardi", créé par Erwan, avec tous les 15 joueurs
4. Crée 3 matchs passés (statut "rated") avec :
   - Tous les 14 joueurs confirmés + attended=true (sauf 1-2 no-shows aléatoires)
   - Équipes A/B assignées
   - Scores réalistes (3-2, 5-4, 2-2)
   - Des ratings variés (entre 2 et 5) pour chaque joueur par 3-4 raters différents
5. Crée 1 match à venir (statut "open", date = prochain mardi 20h) avec 8 confirmés et 2 en waitlist
6. Calcule et insère les player_stats à partir des ratings
7. Utilise des share_token nanoid de 10 chars

Le script doit être idempotent (vide les tables avant d'insérer). Log chaque étape dans la console.
```

**Done when :** `pnpm db:seed` s'exécute sans erreur. `pnpm db:studio` montre les données dans toutes les tables.

---

### PHASE 2 — Match CRUD + RSVP

#### Tâche 2.1 : Création de match

**Prompt Claude Code :**
```
Crée le formulaire de création de match pour l'organisateur connecté.

Page : src/app/(dashboard)/matches/new/page.tsx
Composant : src/components/match/match-form.tsx
API : POST src/app/api/matches/route.ts

Champs du formulaire (shadcn/ui, mobile-first) :
- Titre (optionnel, placeholder "Ex: Foot du mardi")
- Date + Heure (date picker + time input)
- Lieu (text input, placeholder "Ex: UrbanSoccer Nice")
- Nombre de joueurs max (number input, default 14, min 6, max 22)
- Nombre de joueurs min (number input, default 10)
- Deadline de confirmation (datetime, optionnel)
- Groupe (select parmi les groupes de l'organisateur, optionnel)
- Récurrence (toggle : one-shot / hebdomadaire)

Validation Zod côté API. Génère un share_token nanoid(10) automatiquement.
Après création, redirect vers la page du match avec un toast "Match créé ! Partage ce lien" + le lien copiable /m/{shareToken}.
```

**Done when :** créer un match redirige vers sa page avec le lien partageable. Le match apparaît en DB.

---

#### Tâche 2.2 : Page publique match + RSVP guest

**Prompt Claude Code :**
```
Crée la page publique du match accessible SANS compte.

Page : src/app/m/[shareToken]/page.tsx (Server Component pour OG tags)
Composants : rsvp-button.tsx, player-list.tsx

La page affiche :
- Titre du match (ou "Match du [date]" si pas de titre)
- Date, heure, lieu
- Nombre de places : "8/14 confirmés" avec une barre de progression
- Liste des joueurs confirmés (noms) + waitlist séparée
- Deadline si définie

Flow RSVP guest (client component) :
1. Input "Ton prénom" + bouton "Je suis là !"
2. POST /api/rsvp avec { shareToken, guestName }
3. L'API crée un guest_token (nanoid 10), le stocke en match_players, et le retourne
4. Le guest_token est sauvé en cookie httpOnly (30 jours) ET localStorage
5. Si le match est plein → statut waitlisted + message "Tu es en liste d'attente (position X)"
6. Si le joueur revient (cookie reconnu) → affiche son statut + bouton "Me désinscrire"

Flow RSVP user connecté :
1. Pas de champ prénom, juste bouton "Je suis là !"
2. Utilise le user_id de la session

OG meta tags dynamiques pour preview WhatsApp :
- og:title = titre du match ou "Match du [date]"
- og:description = "[X/Y] joueurs confirmés • [lieu] • [date heure]"
- og:image = générer une image OG simple avec ces infos (src/lib/og.ts via @vercel/og)

La page doit charger en <1s sur 3G.
```

**Done when :** ouvrir `/m/{token}` sans être connecté affiche le match. RSVP guest fonctionne, le cookie persiste. Preview WhatsApp affiche les bonnes infos.

---

#### Tâche 2.3 : Waitlist + désistement + promotion

**Prompt Claude Code :**
```
Implémente la logique complète de gestion des places.

API : PATCH /api/rsvp (actions: cancel, rejoin)

Quand un joueur se désiste (cancel) :
1. Son statut passe à "cancelled"
2. Si des joueurs sont en waitlist → le premier (par confirmed_at) est promu à "confirmed"
3. Si le joueur promu a un email (user avec compte) → envoyer un email via Resend : "Bonne nouvelle ! Une place s'est libérée pour [match]"

Quand le max_players est atteint :
- Le statut du match passe à "full"
- Les nouveaux RSVP vont en waitlist

Quand un joueur waitlisté est promu et que le match est "full" :
- Si une place se libère, le match repasse à "open" puis "full" quand re-rempli

Bouton "Me désinscrire" visible pour le joueur (guest via cookie, user via session).
La player-list se met à jour sans rechargement (revalidatePath ou polling 30s).
```

**Done when :** scénario complet : match plein → joueur cancel → waitlisté promu automatiquement → email envoyé.

---

#### Tâche 2.4 : Dashboard organisateur

**Prompt Claude Code :**
```
Crée le dashboard de l'organisateur connecté.

Page : src/app/(dashboard)/page.tsx

Affiche 3 sections :
1. "Prochain match" — card du prochain match avec : date, lieu, X/Y confirmés, lien partageable (bouton copier), bouton "Voir le match"
2. "Mes matchs" — liste des 5 derniers matchs (cards compactes) avec statut (badge coloré), date, nombre de joueurs. Lien "Voir tout" → /dashboard/matches
3. "Mes groupes" — liste des groupes avec nombre de membres. Lien "Voir tout" → /dashboard/groups

Header avec : nom de l'utilisateur, bouton "Nouveau match" (CTA principal), menu dropdown (profil, déconnexion).
Navigation mobile : bottom tab bar avec icônes (Accueil, Matchs, Groupes, Profil).

Tout en Server Components sauf le bouton copier (client).
```

**Done when :** le dashboard affiche les données du seed. Navigation mobile fluide.

---

### PHASE 3 — Team Balancing

#### Tâche 3.1 : Algorithme de balancing

**Prompt Claude Code :**
```
Crée src/lib/team-balancer.ts

Input : tableau de joueurs avec { id, name, avg_technique, avg_physique, avg_collectif } (les moyennes viennent de player_stats, défaut 3.0 si pas de stats)

Algorithme :
1. Calcul score global par joueur : technique * 0.4 + physique * 0.3 + collectif * 0.3
2. Pour n joueurs, générer toutes les combinaisons de n/2 joueurs pour l'équipe A (le reste = équipe B)
3. Pour chaque combinaison, calculer |somme_scores_A - somme_scores_B|
4. Garder toutes les combinaisons avec la plus petite différence
5. En choisir une au hasard parmi les meilleures
6. Si nombre impair de joueurs, l'équipe A a le joueur en plus

Retourne : { teamA: Player[], teamB: Player[], scoreA: number, scoreB: number, diff: number }

Optimisation : pour ≤20 joueurs, brute-force OK (C(20,10) = 184 756, <100ms). Au-delà de 20 (improbable), fallback sur tri par score + alternance serpentine.

Exporte aussi une fonction rebalance(currentTeams, droppedPlayerId, newPlayerId?) qui recalcule sans repartir de zéro si possible.

Écris des tests unitaires (vitest) :
- 10 joueurs avec scores variés → diff ≤ 0.5
- 14 joueurs → diff ≤ 1.0
- Nombre impair → une équipe a 1 joueur de plus
- Joueurs sans stats (score 3.0) → ne crash pas
- rebalance après un drop → les équipes restent équilibrées
```

**Done when :** `pnpm test` passe. L'algo balance 14 joueurs en <50ms.

---

#### Tâche 3.2 : UI équipes + API

**Prompt Claude Code :**
```
Crée l'endpoint et l'UI de génération des équipes.

API : POST /api/teams avec { matchId }
- Vérifie que l'utilisateur est l'organisateur du match
- Récupère les joueurs confirmés + leurs player_stats
- Appelle team-balancer
- Sauvegarde les assignments (team A/B) dans match_players
- Passe le match en statut "locked"
- Retourne les deux équipes avec scores

Page : src/app/match/[id]/teams/page.tsx
Composant : src/components/match/team-reveal.tsx

UI mobile-first :
- Deux colonnes "Équipe A" / "Équipe B" (ou noms d'équipe fun auto-générés)
- Chaque joueur : avatar (initiales), nom, score global (petit badge)
- En bas : score total de chaque équipe + différence
- Badge "Équilibré ✓" si diff < 0.5, "Léger avantage" si 0.5-1.5, "Déséquilibré ⚠️" si > 1.5
- Bouton "Remélanger" (re-randomise parmi les combos optimales)
- Bouton "Valider les équipes" (lock définitif)
- Animation : les joueurs apparaissent un par un en alternance (style draft pick), 300ms entre chaque

L'organisateur peut drag-and-drop un joueur d'une équipe à l'autre (override manuel), le score se recalcule en temps réel.

Cette page est aussi accessible via le lien public /m/{shareToken} une fois le match locked (lecture seule, sans drag-and-drop).
```

**Done when :** générer des équipes avec les données du seed produit deux équipes visuellement équilibrées. L'animation de draft est fluide sur mobile.

---

### PHASE 4 — Post-Match + Profil Joueur

#### Tâche 4.1 : Clôture match + fiche de présence

**Prompt Claude Code :**
```
Crée le flow de clôture de match par l'organisateur.

API : PATCH /api/matches/[id]/close avec { score_team_a, score_team_b, attendance: [{ playerId, attended }] }

Page : src/app/match/[id]/attendance/page.tsx
Composant : src/components/match/attendance-form.tsx

UI :
- Liste de tous les joueurs confirmés avec un toggle par joueur : ✅ Présent / ❌ Absent
- Champs score : "Équipe A [__] - [__] Équipe B"
- Champ résumé du match (textarea optionnel, placeholder "Moments forts, MVP...")
- Bouton "Clôturer le match"

Quand clôturé :
1. Le match passe en statut "played"
2. Les joueurs marqués absents passent en statut "no_show" dans match_players
3. Recalcul du attendance_rate dans player_stats pour chaque joueur concerné
4. Un email est envoyé à tous les participants (qui ont un email) : "Comment s'est passé le match ? Note tes coéquipiers → [lien notation]"
```

**Done when :** clôturer un match du seed met à jour les statuts et envoie les emails de notation.

---

#### Tâche 4.2 : Notation post-match

**Prompt Claude Code :**
```
Crée le système de notation post-match.

API : POST /api/ratings avec { matchId, raterId (user_id ou guest_token), ratings: [{ ratedId, technique, physique, collectif, comment? }] }
- Vérifie que le rater était dans le match
- Vérifie qu'il n'a pas déjà noté ce match
- Vérifie que les notes sont entre 1 et 5
- Sauvegarde les ratings
- Recalcule player_stats pour chaque joueur noté (moyenne incrémentale)

Page guest : src/app/m/[shareToken]/rate/page.tsx
Page user : src/app/match/[id]/rate/page.tsx (redirige vers la même UI)

Composants : rating-form.tsx, star-input.tsx, player-rating-card.tsx

UI mobile-first :
- Liste de tous les joueurs du match (sauf soi-même)
- Pour chaque joueur : une card avec son nom et 3 lignes d'étoiles (technique, physique, collectif)
- Le star-input est tactile-friendly (étoiles assez grosses pour le pouce, 44x44px min)
- Champ commentaire optionnel sous les étoiles (textarea, max 280 chars, placeholder "Un mot sur son match...")
- Bouton "Envoyer mes notes" en bas (sticky sur mobile)
- Après envoi : message de remerciement + CTA "Créer un compte pour voir ton historique" (si guest)

Le match passe en statut "rated" quand ≥50% des joueurs ont noté.
```

**Done when :** un guest et un user peuvent noter. Les player_stats sont recalculées. Le CTA compte apparaît pour les guests.

---

#### Tâche 4.3 : Profil joueur (fiche de scouting)

**Prompt Claude Code :**
```
Crée la page profil joueur — l'outil principal de sélection pour l'organisateur.

API : GET /api/players/[id] — retourne le joueur + ses stats + historique matchs + commentaires
Page : src/app/player/[id]/page.tsx
Composants : player-profile.tsx, stats-overview.tsx, radar-chart.tsx, match-history.tsx, comments-list.tsx

UI mobile-first, scrollable en une page :

1. **Header** — nom du joueur, avatar (initiales), membre depuis [date]

2. **Métriques clés** — 4 cards en grille 2x2 :
   - Matchs joués (nombre)
   - Note globale (score /5 avec une décimale)
   - Taux de présence (% avec badge couleur : 🟢 ≥90%, 🟡 70-89%, 🔴 <70%)
   - Dernier match (date relative : "il y a 3 jours")

3. **Graphique radar** — technique / physique / collectif (utilise recharts RadarChart)
   - Échelle 1-5
   - Overlay avec les moyennes du groupe en gris transparent pour comparaison

4. **Tendance** — sparkline ou flèches simples montrant l'évolution des 5 dernières notes (↑ progression, ↓ régression, → stable). Seuil : ±0.3 entre première et dernière = stable.

5. **Historique des matchs** — liste scrollable, 10 derniers :
   - Date + lieu
   - Équipe (A ou B) + résultat (3-2 ✓, 2-4 ✗, 2-2 ≈)
   - Sa note reçue pour ce match (petit badge)

6. **Commentaires reçus** — liste chrono des 10 derniers commentaires anonymes
   - Texte du commentaire
   - Date relative
   - Pas de nom du commentateur (anonyme)

Accessible par l'organisateur depuis la player-list d'un match (clic sur le nom = lien vers profil).
Le joueur connecté voit son propre profil depuis le menu.
Si c'est un guest sans compte, afficher un CTA "Crée ton compte pour accéder à ton profil complet".
```

**Done when :** le profil d'un joueur du seed affiche toutes les sections avec les données. Le radar chart est lisible sur mobile. L'organisateur peut naviguer depuis un match vers les profils.

---

### PHASE 5 — Groupes + Récurrence

#### Tâche 5.1 : CRUD Groupes + invitation

**Prompt Claude Code :**
```
Crée le système de groupes.

API :
- POST /api/groups — créer un groupe (name, slug auto-généré depuis le name)
- GET /api/groups/[slug] — détails du groupe + membres + stats
- POST /api/groups/[slug]/join — rejoindre via invite_code
- GET /api/groups/[slug]/leaderboard — classement par avg_overall

Pages :
- src/app/(dashboard)/groups/new/page.tsx — formulaire création
- src/app/group/[slug]/page.tsx — page du groupe

UI page groupe :
- Header : nom du groupe, nombre de membres, code d'invitation copiable
- Leaderboard : classement des joueurs par note globale, avec colonnes : rang, nom, note globale, matchs joués, taux de présence. Les 3 premiers ont un badge 🥇🥈🥉.
- Bouton "Inviter" → génère un lien /group/{slug}/join?code={invite_code}
- Onglet "Matchs" → historique des matchs du groupe (lien vers chaque match)
- Onglet "Membres" → liste des membres avec mini-stats (clic → profil joueur)

Le lien d'invitation fonctionne pour les users connectés. Pour les guests, il redirige vers /register avec un query param ?joinGroup={slug}&code={invite_code} qui auto-join après inscription.
```

**Done when :** créer un groupe, inviter un joueur via lien, voir le leaderboard avec les données du seed.

---

#### Tâche 5.2 : Matchs récurrents

**Prompt Claude Code :**
```
Implémente la récurrence hebdomadaire des matchs.

Quand un match est créé avec recurrence="weekly" :
- Il devient le "match parent"
- Un cron API (via Vercel Cron dans vercel.json) tourne chaque jour à 00h00
- Le cron vérifie les matchs récurrents dont le prochain match n'a pas encore été créé
- Il crée automatiquement le match de la semaine suivante (même heure, même lieu, même max_players, même groupe)
- Le nouveau match a parent_match_id = id du match parent
- Le nouveau match est en statut "open"
- Un email est envoyé aux membres du groupe : "Le [nom du match] de cette semaine est ouvert ! Confirme ta dispo → [lien]"

API : src/app/api/cron/weekly-matches/route.ts (protégé par CRON_SECRET dans vercel.json)

Les joueurs du groupe ne sont PAS auto-confirmés — ils doivent RSVP chaque semaine. C'est le comportement voulu (on veut mesurer la fiabilité).

Dans la page du match récurrent, afficher un lien "Voir les matchs précédents" qui liste toutes les occurrences passées.
```

**Done when :** le cron crée un nouveau match pour le groupe du seed. Les matchs précédents sont liés.

---

### PHASE 6 — Polish + Deploy

#### Tâche 6.1 : OG tags + partage WhatsApp

**Prompt Claude Code :**
```
Optimise le partage du lien de match sur WhatsApp.

Dans src/app/m/[shareToken]/page.tsx, ajoute des metadata dynamiques :
- og:title = "[Titre ou 'Match du mardi'] — kickoff"
- og:description = "⚽ [8/14] joueurs • 📍 UrbanSoccer Nice • 📅 Mar 15 avril 20h"
- og:image = image OG générée dynamiquement

Crée src/app/api/og/route.tsx avec @vercel/og (ImageResponse) :
- Image 1200x630
- Fond vert foncé (#2D5016)
- Titre du match en blanc, gros
- Infos : joueurs confirmés, lieu, date
- Logo "kickoff" en petit en bas

Teste que la preview WhatsApp est correcte (utilise https://developers.facebook.com/tools/debug/ pour valider).
```

**Done when :** partager un lien de match sur WhatsApp affiche une preview avec image, titre et description.

---

#### Tâche 6.2 : Notifications email

**Prompt Claude Code :**
```
Centralise l'envoi d'emails dans src/lib/notifications.ts avec Resend.

Templates à créer (HTML simple, responsive, branded kickoff) :
1. "Promu de la waitlist" — "Bonne nouvelle [prénom] ! Une place s'est libérée pour [match]. → Voir le match"
2. "Rappel deadline" — "Plus que 2h pour confirmer ta présence à [match]. → Confirmer"
3. "Match clôturé — note tes coéquipiers" — "Comment s'est passé [match] ? Note tes coéquipiers → [lien notation]"
4. "Nouveau match récurrent" — "Le [titre] de cette semaine est ouvert ! → Confirmer ta dispo"
5. "Bienvenue" — "Bienvenue sur kickoff, [prénom] ! Tu peux maintenant créer tes propres matchs."

Pour le rappel deadline, crée un cron Vercel qui tourne toutes les heures et envoie le rappel 2h avant la deadline aux joueurs qui n'ont pas encore confirmé.

Chaque email a un footer : "Tu reçois cet email parce que tu participes à un match sur kickoff. [Se désinscrire]"
```

**Done when :** chaque scénario d'email fonctionne. Les templates sont lisibles sur mobile.

---

#### Tâche 6.3 : Merge guest → user

**Prompt Claude Code :**
```
Implémente le merge quand un guest crée un compte.

Flow :
1. Le guest a joué à des matchs identifié par son guest_token (stocké en cookie)
2. Il clique "Créer un compte" depuis son profil ou la page de notation
3. À l'inscription (POST /api/auth/register), le système :
   a. Lit le guest_token depuis le cookie
   b. Cherche tous les match_players avec ce guest_token
   c. Met à jour ces lignes : user_id = nouveau user.id, guest_name = null, guest_token = null
   d. Cherche tous les ratings où rater_id = guest_token ou rated_id = guest_token
   e. Met à jour ces ratings avec le nouveau user.id
   f. Recalcule player_stats pour ce user
4. Le cookie guest_token est supprimé
5. Redirect vers /dashboard

Edge cases à gérer :
- Le guest a utilisé plusieurs prénoms différents → tous les guest_tokens du même cookie sont mergés
- Le guest a déjà un compte avec le même email → merge les données sur le compte existant
- Pas de guest_token en cookie → inscription normale, pas de merge

Écris un test qui : crée un guest, lui fait RSVP 3 matchs, le fait noter, puis crée un compte → vérifie que les 3 matchs et les ratings apparaissent sur son profil.
```

**Done when :** un guest qui crée un compte retrouve tout son historique. Le test passe.

---

#### Tâche 6.4 : Final polish + deploy

**Prompt Claude Code :**
```
Passe finale de qualité avant le premier vrai match.

1. Error boundaries : ajoute error.tsx et loading.tsx dans chaque route group
2. Loading states : skeleton loaders sur les pages qui fetch (dashboard, match, profil)
3. Responsive check : vérifie chaque page sur 375px (iPhone SE), 390px (iPhone 14), 412px (Android mid-range)
4. Accessibilité : aria-labels sur les boutons icônes, focus rings, contrast ratio ≥ 4.5:1
5. Performance : lazy load les composants lourds (radar-chart, team-reveal animation)
6. 404 page custom avec CTA retour accueil
7. Vérifie que `pnpm build` passe sans warning
8. Vérifie que `pnpm typecheck` passe
9. Vérifie que `pnpm lint` passe
10. Deploy `vercel --prod`
```

**Done when :** l'app est live sur Vercel. Le lien de match du seed s'ouvre correctement depuis un navigateur mobile.

---

## Checklist pré-deploy finale

- [ ] `pnpm build` passe sans erreur ni warning
- [ ] `pnpm typecheck` passe
- [ ] Le lien `/m/{token}` fonctionne sans être connecté
- [ ] RSVP guest fonctionne (prénom + cookie)
- [ ] RSVP user connecté fonctionne (1-click)
- [ ] Waitlist → promotion automatique quand un joueur cancel
- [ ] Team balancing produit des équipes équilibrées avec 10-14 joueurs
- [ ] Animation draft pick fluide sur mobile
- [ ] Clôture match + fiche de présence fonctionne
- [ ] Notation post-match fonctionne pour guests ET users
- [ ] player_stats recalculées après notation
- [ ] Profil joueur affiche : stats, radar, historique, commentaires
- [ ] Merge guest → user préserve tout l'historique
- [ ] OG tags testés sur WhatsApp (preview correcte)
- [ ] Emails envoyés (waitlist promo, notation, récurrence)
- [ ] Responsive OK sur iPhone SE, iPhone 14, Samsung Galaxy
- [ ] PWA installable depuis Chrome mobile
- [ ] Leaderboard du groupe fonctionne
- [ ] Matchs récurrents auto-créés par le cron
- [ ] Deploy Vercel prod live

<!-- GSD:project-start source:PROJECT.md -->
## Project

**kickoff**

A Progressive Web App (PWA) for organizing casual football (soccer) matches between friends. The app solves the logistical nightmare of weekly match coordination through a simple flow: Create → Invite → Confirm → Balance Teams → Play → Rate. Players can RSVP via a single WhatsApp link without creating an account, while the organizer gets intelligent team balancing based on post-match ratings.

**Core Value:** **Zero-friction RSVP via shared link.** The guest flow (no account required) is the primary entry point — if that doesn't work, nothing else matters.

### Constraints

- **Tech Stack**: Next.js 15, Neon/Drizzle, better-auth, shadcn/ui, Tailwind v4, Resend, Vercel — stack is already proven on other projects
- **Timeline**: 4-week MVP target to validate core hypothesis (zero-friction RSVP works)
- **Budget**: Free tiers only (Neon 0.5GB, Vercel Hobby, Resend 3K/mo) — must stay within limits
- **Mobile-First**: 95% of interactions happen from WhatsApp on phone — if it doesn't work on iPhone SE, it's broken
- **Guest Flow Priority**: The without-account RSVP is the primary entry point — account creation is optional
- **French Market**: Initial users are French, but app should be language-agnostic from start
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Executive Summary
## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 15.x (latest) | React framework with App Router | SSR for WhatsApp link previews, Server Components reduce JS bundle, Turbopack for fast builds |
| **React** | 19.x | UI library | Required by Next.js 15, concurrent features for smooth mobile animations |
| **TypeScript** | 5.x | Type safety | Strict mode required, catches bugs at compile time |
- Next.js 15 App Router provides Server Components by default, which means less JavaScript sent to mobile devices
- SSR is critical for the primary growth channel (WhatsApp link sharing) — OG tags need server rendering
- Turbopack (default in Next.js 15) provides faster iteration during development
- React 19's concurrent features enable smooth animations for team reveal drafts
- Remix: Excellent for forms, but Next.js has better Vercel integration and more familiar ecosystem
- SvelteKit: Smaller bundle, but less mature ecosystem for PWA patterns
### Database & ORM
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Neon** | Latest (serverless) | PostgreSQL hosting | Free tier 0.5GB, auto-scaling, serverless (cold starts <100ms), built on PostgreSQL 15+ |
| **Drizzle ORM** | Latest | Type-safe database queries | Lightweight compared to Prisma, excellent TypeScript support, query builders for complex relations |
| **Drizzle Kit** | Latest | Migrations & schema management | Best-in-class migration experience, diff-based schema updates |
- Neon's serverless architecture aligns with Vercel's edge model — no connection pooling complexity
- Drizzle's query builders are more ergonomic than raw SQL but lighter than Prisma's query engine
- For multi-user concurrent access (match RSVP spikes), PostgreSQL's ACID guarantees prevent race conditions
- Drizzle's schema-as-code approach fits the TypeScript-first philosophy
- Supabase: Overkill for this use case, adds auth/storage complexity not needed
- Prisma: Heavier runtime, slower cold starts on serverless
### Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **better-auth** | Latest | Auth library | Magic link + email/password, Drizzle adapter, TypeScript-first, lighter than NextAuth |
| **Resend** | Latest | Email delivery | Magic link delivery, transactional emails, free tier 3K/month |
- better-auth is the successor to Lucia (battle-tested), with better DX and TypeScript support
- Native Drizzle adapter means no custom session management code
- Magic links reduce friction for guest → user conversion (no password required)
- JWT session strategy reduces database hits for authenticated requests
- Proven on Alignd project — no surprises
- NextAuth.js (Auth.js): Heavier, more complex setup for simple email/password + magic link use case
- Clerk: Overkill, adds cost ($$$), vendor lock-in
### Styling & UI
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Tailwind CSS** | v4 (latest) | Utility-first CSS | v4 brings native CSS support, faster builds, smaller bundle size |
| **shadcn/ui** | Latest | Component library | Copy-paste components (no npm package), full customization, built on Radix UI (accessibility) |
| **Lucide React** | Latest | Icon library | Lightweight, tree-shakeable, consistent with shadcn/ui |
- Tailwind CSS v4 uses native CSS instead of PostCSS, enabling faster builds and better browser dev tools
- shadcn/ui's "you own the code" philosophy means full customization for mobile touch targets (44x44px minimum)
- Radix UI primitives (underlying shadcn/ui) handle keyboard navigation, screen readers, and ARIA attributes automatically
- Utility-first approach enables rapid prototyping of responsive mobile layouts
- Configuration moves from `tailwind.config.js` to CSS `@theme` directive
- Use `@import "tailwindcss"` instead of PostCSS plugins
- Custom colors go in CSS, not JS config
- Chakra UI: Heavier bundle, harder to customize
- MUI: Not mobile-first by default, enterprise feel
- Headless UI: Good but less complete than Radix primitives
### PWA & Offline
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **next-pwa** | v5.7+ (check Next.js 15 compat) | PWA manifest & service worker | Automated manifest generation, workbox for caching strategies |
| **@vercel/og** | Latest | OG image generation | Dynamic WhatsApp link previews with match details |
- PWA is critical for the "no app store" requirement — installable from mobile browser
- Service workers cache app shell (layout, CSS, fonts) for instant repeat loads
- Network-first strategy for API calls ensures fresh match data
- @vercel/og generates social card images at the edge for WhatsApp previews
- Cache-first: App shell (layout, CSS, fonts, icons)
- Network-first: API routes (matches, rsvp, ratings)
- Stale-while-revalidate: Static assets (images)
- Manual service worker: More control but higher maintenance burden
- Workbox directly: Lower-level, next-pwa wraps it well
### Form Validation & Data
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Zod** | Latest | Schema validation | Type-safe validation, integrates with Drizzle, single source of truth |
| **nanoid** | Latest | Unique IDs | URL-safe share tokens (10 chars), collision-resistant |
| **date-fns** | Latest | Date utilities | Lightweight tree-shakeable, better than Moment.js |
- Zod schemas can infer TypeScript types — define once, use everywhere
- Drizzle integrates with Zod for runtime validation of database queries
- nanoid(10) for share tokens = ~1.5 billion combinations, sufficient for MVP
- date-fns provides relative dates ("il y a 3 jours") for French locale
### Notifications & Cron
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Resend** | Latest | Transactional emails | Free tier 3K/mois, React email templates, reliable delivery |
| **Vercel Cron** | Native | Scheduled tasks | Built-in to Vercel, no external cron service needed |
- Resend's free tier (3K emails/month) covers MVP needs for match reminders
- Vercel Cron Jobs (configured in `vercel.json`) handle weekly match creation
- Email templates use React for type-safe, responsive HTML
### Testing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | Latest | Unit tests | Fast, native ESM, Jest-compatible API |
| **Playwright** | Latest | E2E tests | Mobile viewport testing, WhatsApp link flow simulation |
- Vitest integrates with Vite/Next.js build pipeline, faster than Jest
- Playwright can test mobile viewports (iPhone SE, 375px) for responsive validation
- Team balancing algorithm needs unit tests for edge cases (odd players, no-shows)
### Hosting & Deployment
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel** | Latest | Application hosting | Edge rendering, preview deploys, free tier for hobby projects |
| **Neon** | Serverless | Database hosting | Free tier 0.5GB, auto-scaling, no connection pooling needed |
- Vercel's Edge Network renders OG tags close to users for fast WhatsApp previews
- Preview deploys enable testing before merging to main
- Vercel Cron Jobs eliminate need for external cron services
- Neon's serverless driver (`@neondatabase/serverless`) handles connection pooling automatically
## Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Recharts** | Latest | Radar charts for player stats | Player profile page (technique/physique/collectif visualization) |
| **Sonner** | Latest | Toast notifications | shadcn/ui recommended, better than react-hot-toast |
| **clsx** | Latest | Conditional class names | Mobile-first responsive utilities |
| **react-hook-form** | Latest | Form performance | Large forms (match creation, player rating) |
| **zod-form-data** | Latest | Form validation | Server Actions validation |
## Installation
# Core dependencies
# Database
# Authentication
# Styling & UI
# shadcn/ui setup (components copied to project)
# PWA
# Validation & Utilities
# Email
# Testing
## Key Configuration Files
### `next.config.ts`
### `drizzle.config.ts`
### `vercel.json`
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
## Sources
- **HIGH:** Official documentation, proven in production (Alignd, EnAgent projects)
- **MEDIUM:** Ecosystem trends, requires verification of specific versions
- **LOW:** WebSearch only (not available due to rate limiting), needs validation
- better-auth official documentation (accessed 2026-03-29)
- Next.js 15 release notes (known from training data)
- Neon technical documentation (known from training data)
- Drizzle ORM documentation (known from training data)
- shadcn/ui documentation (known from training data)
- Tailwind CSS v4 migration guide — **MEDIUM confidence**, verify CSS @theme syntax
- next-pwa Next.js 15 compatibility — **MEDIUM confidence**, check GitHub issues
- @vercel/og latest API — **HIGH confidence**, stable API surface
- **Phase 1.4 (PWA config):** Verify next-pwa v5.7+ works with Next.js 15, fallback to manual service worker if needed
- **Phase 1.2 (Database schema):** Test Drizzle migrations on Neon free tier before committing schema
- **Phase 6.1 (OG images):** Test @vercel/og image generation on Vercel Edge before production
## Migration Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind v4 breaking changes | CSS utility classes may break | Use v4's `@theme` directive from start, avoid v3 patterns |
| next-pwa incompatibility | Service worker may not register | Fallback to manual workbox setup if needed |
| better-auth Drizzle adapter bugs | Session management may fail | Test magic link flow early in Phase 1.3 |
| Neon cold start latency | First RSVP may be slow (>500ms) | Use Neon's `@neondatabase/serverless` with HTTP/2 pooling |
| React 19 concurrent features | Animation glitches on team reveal | Test `useTransition` for draft pick animation in Phase 3.2 |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
