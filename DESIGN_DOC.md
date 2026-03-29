# Design Doc — App Organisation Matchs de Foot (MVP)

**Auteur :** Erwan Henry
**Date :** 2026-03-29
**Statut :** Draft v1
**Nom de code :** `kickoff` (working title, pas de branding avant validation)

---

## 1. Problème

Organiser un match de foot entre potes est un enfer logistique. Chaque semaine, l'organisateur doit :

1. Envoyer un message WhatsApp pour sonder les dispos
2. Relancer les silencieux
3. Compter les joueurs confirmés
4. Gérer les désistements de dernière minute
5. Trouver des remplaçants
6. Faire les équipes (en essayant d'être équitable)
7. Après le match, aucun historique, aucun suivi de niveau

**Résultat :** l'organisateur s'épuise, les matchs sautent, les équipes sont déséquilibrées, et les bons joueurs arrêtent de venir parce que c'est toujours one-sided.

## 2. Solution

Une app web légère (pas de téléchargement) qui résout la boucle complète :

**Créer → Inviter → Confirmer → Équilibrer → Jouer → Noter**

Différenciation clé vs. la concurrence française :
- **Zéro friction** : les joueurs RSVP via un simple lien, sans compte
- **Team balancing intelligent** : algo qui utilise les notes post-match pour former des équipes équilibrées
- **Feedback loop** : les notes d'après-match améliorent le balancing au fil du temps

## 3. Scope MVP (4 semaines)

### 3.1 Fonctionnalités IN

#### Match Management
- Créer un match : date, heure, lieu (texte libre), nombre de joueurs min/max
- Match récurrent (hebdomadaire) : un match parent génère les occurrences
- Annuler / modifier un match
- Statuts : `draft` → `open` → `full` → `locked` → `played` → `rated`

#### RSVP & Joueurs
- **Sans compte (joueur invité)** :
  - Lien partageable unique par match (`/m/{matchId}`)
  - Le joueur entre son prénom + numéro de téléphone (optionnel) pour confirmer
  - Cookie/localStorage pour le reconnaître s'il revient
  - Peut se désinscrire via le même lien
- **Avec compte (organisateur + joueurs réguliers)** :
  - Inscription email + mot de passe (ou magic link)
  - Dashboard : historique des matchs, ses notes, ses stats
  - Peut créer et gérer des matchs (rôle organisateur)
- Waitlist automatique quand le match est plein
  - Promotion automatique du premier en waitlist si quelqu'un se désiste
  - Notification (email) au joueur promu
- Deadline de confirmation (ex: 2h avant le match)
  - Après deadline, le match est "locked" → plus de changements joueurs

#### Team Balancing
- **Input** : liste des joueurs confirmés + leurs notes historiques
- **Axes de notation** (1-5) :
  - `technique` : contrôle, passe, tir
  - `physique` : vitesse, endurance, engagement
  - `collectif` : jeu d'équipe, placement, communication
- **Score global** = moyenne pondérée (technique 40%, physique 30%, collectif 30%)
- **Algorithme** :
  - Pour ≤20 joueurs : brute-force toutes les combinaisons possibles (C(14,7) = 3432 combinaisons pour 14 joueurs, trivial)
  - Objectif : minimiser |score_equipe_A - score_equipe_B|
  - Contrainte secondaire : répartir les positions si renseignées (au moins 1 gardien par équipe)
  - En cas d'égalité : randomiser parmi les combinaisons optimales
- **Auto-rebalance** : si un joueur se désiste après le tirage, recalcul automatique
- Affichage visuel : les deux équipes côte à côte avec score global de chaque équipe
- **Nouveaux joueurs** (pas encore notés) : score par défaut = 3/5 sur chaque axe
- L'organisateur peut override manuellement le tirage

#### Post-Match
- L'organisateur clôture le match → passe en statut `played`
- Chaque joueur (avec ou sans compte) peut noter les autres joueurs présents
  - Notation : 1-5 sur les 3 axes (technique, physique, collectif)
  - Commentaire libre optionnel (max 280 caractères)
  - Un joueur ne peut noter que les joueurs du même match
  - Un joueur ne peut noter qu'une fois par match
- Les notes sont anonymes (le joueur noté voit sa moyenne, pas qui a noté quoi)
- L'organisateur peut poster un résumé du match (score final, MVP, moments forts)
- Les notes moyennes sont stockées et alimentent le team balancing futur

#### Groupes
- Un organisateur peut créer un "groupe" (ex: "Foot du mardi")
- Inviter des joueurs au groupe via lien
- Les matchs récurrents sont liés à un groupe
- Un joueur peut être dans plusieurs groupes
- Le groupe a son propre classement / leaderboard (basé sur les notes moyennes)

### 3.2 Fonctionnalités OUT (pas dans le MVP)

- Paiement / collecte d'argent (Phase 2)
- Réservation de terrain (Phase 3)
- Marketplace "trouver un match" entre inconnus (Phase 3+)
- App native iOS/Android (PWA suffit)
- Chat intégré (WhatsApp fait déjà le job)
- Stats avancées (buts, passes décisives, etc.)
- Intégration calendrier (Google Cal sync)

## 4. Architecture technique

### 4.1 Stack

| Composant | Choix | Justification |
|-----------|-------|---------------|
| Framework | Next.js 15 (App Router) | Stack maîtrisée, SSR pour les liens partageables |
| Base de données | Neon (PostgreSQL serverless) | Multi-user concurrent, free tier 0.5 GB, backups auto |
| ORM | Drizzle ORM | Léger, type-safe, excellent support PostgreSQL |
| CSS | Tailwind CSS | Rapidité de dev |
| UI | shadcn/ui | Composants accessibles, personnalisables |
| Auth | better-auth | Déjà utilisé sur Alignd, magic link + email/password |
| Hosting | Vercel | Edge rendering (liens WhatsApp rapides), preview deploys, serverless scaling |
| Email | Resend | Notifications transactionnelles, free tier 3K emails/mois |

### 4.2 Modèle de données

```
users
├── id (uuid)
├── email (unique, nullable pour invités promus)
├── name
├── phone (nullable)
├── created_at
└── updated_at

groups
├── id (uuid)
├── name
├── slug (unique, pour URL)
├── created_by → users.id
├── invite_code (unique)
├── created_at
└── updated_at

group_members
├── group_id → groups.id
├── user_id → users.id
├── role (organizer | player)
└── joined_at

matches
├── id (uuid)
├── group_id → groups.id (nullable, match peut être hors groupe)
├── created_by → users.id
├── title (nullable)
├── location (text)
├── date (datetime)
├── max_players (int)
├── min_players (int, default 10)
├── status (draft | open | full | locked | played | rated)
├── deadline (datetime, nullable)
├── recurrence (none | weekly)
├── parent_match_id (nullable, pour récurrence)
├── match_summary (text, nullable)
├── score_team_a (int, nullable)
├── score_team_b (int, nullable)
├── share_token (unique, pour URL publique)
├── created_at
└── updated_at

match_players
├── match_id → matches.id
├── user_id → users.id
├── status (confirmed | waitlisted | cancelled | no_show)
├── team (null | A | B)
├── guest_name (nullable, pour joueurs sans compte)
├── guest_token (nullable, pour reconnaître le joueur invité)
├── confirmed_at
├── cancelled_at
└── attended (boolean, nullable — marqué par l'orga après le match)

ratings
├── id (uuid)
├── match_id → matches.id
├── rater_id → users.id (celui qui note)
├── rated_id → users.id (celui qui est noté)
├── technique (1-5)
├── physique (1-5)
├── collectif (1-5)
├── comment (text, nullable, max 280)
├── created_at
└── UNIQUE(match_id, rater_id, rated_id)

player_stats (vue matérialisée ou table calculée)
├── user_id → users.id
├── group_id → groups.id (nullable, stats globales si null)
├── matches_played (int)
├── matches_confirmed (int — nombre total de RSVP confirmés)
├── matches_attended (int — effectivement présent)
├── matches_no_show (int — confirmé mais absent)
├── attendance_rate (decimal — attended / confirmed, en %)
├── avg_technique (decimal)
├── avg_physique (decimal)
├── avg_collectif (decimal)
├── avg_overall (decimal)
├── total_ratings_received (int)
├── last_match_date (datetime)
├── last_updated
└── UNIQUE(user_id, group_id)
```

### 4.3 Routes principales

```
/ → Landing page (hero + CTA "Créer un match")
/login → Connexion / inscription
/dashboard → Mes matchs, mes groupes, mes stats
/m/{shareToken} → Page publique du match (RSVP sans compte)
/match/{id} → Détail match (vue organisateur)
/match/{id}/rate → Page de notation post-match
/match/{id}/teams → Visualisation des équipes
/group/{slug} → Page du groupe + classement
/group/{slug}/matches → Historique des matchs du groupe
/api/... → API routes Next.js
```

### 4.4 Algo Team Balancing (pseudo-code)

```
function balanceTeams(players: Player[]): [Team, Team] {
  // 1. Calculer le score global de chaque joueur
  const scored = players.map(p => ({
    ...p,
    score: p.avg_technique * 0.4 + p.avg_physique * 0.3 + p.avg_collectif * 0.3
  }));

  // 2. Générer toutes les combinaisons possibles pour l'équipe A
  //    (l'équipe B = le reste)
  const n = scored.length;
  const halfSize = Math.floor(n / 2);
  const combinations = generateCombinations(scored, halfSize);

  // 3. Pour chaque combinaison, calculer la différence de score
  let bestDiff = Infinity;
  let bestCombos: Combo[] = [];

  for (const teamA of combinations) {
    const teamB = scored.filter(p => !teamA.includes(p));
    const diff = Math.abs(sum(teamA.score) - sum(teamB.score));
    if (diff < bestDiff) {
      bestDiff = diff;
      bestCombos = [{ teamA, teamB }];
    } else if (diff === bestDiff) {
      bestCombos.push({ teamA, teamB });
    }
  }

  // 4. Parmi les meilleures, en choisir une au hasard
  return randomPick(bestCombos);
}
```

**Note :** Pour 14 joueurs (format foot5 typique : 7v7 ou 6v6+1 gardien), C(14,7) = 3432 combinaisons. Calcul instantané. Pour 20 joueurs max, C(20,10) = 184 756. Toujours trivial (<50ms).

## 5. Gestion des joueurs invités (sans compte)

Flow critique pour la rétention :

1. L'organisateur crée un match et obtient un lien `/m/{shareToken}`
2. Il partage ce lien sur WhatsApp
3. Le joueur clique → voit les détails du match + liste des confirmés
4. Il entre son prénom → reçoit un `guest_token` stocké en cookie
5. Avec ce token, il peut :
   - Voir son statut (confirmé / waitlist)
   - Se désinscrire
   - Après le match : noter les autres joueurs
6. S'il veut voir son historique / ses stats → CTA "Créer un compte" (email ou magic link)
7. À la création du compte, tous ses `guest_token` sont rattachés à son `user_id` via matching prénom+téléphone ou merge manuel par l'organisateur

## 6. Notifications

MVP minimal — email uniquement (via Resend, coût quasi nul) :

- **Joueur promu de la waitlist** : "Bonne nouvelle ! Une place s'est libérée pour [match]"
- **Rappel avant deadline** : "Plus que 2h pour confirmer ta présence à [match]"
- **Match locked** : "Les équipes de [match] sont prêtes ! Voici ta team..."
- **Appel à notation** : "Comment s'est passé le match ? Note tes coéquipiers"
- **Récurrence** : "Le match de [groupe] de cette semaine est ouvert, confirme ta dispo"

## 7. UX/Design Principles

- **Mobile-first** : 95% des interactions se font depuis un lien WhatsApp sur téléphone
- **1-tap RSVP** : le joueur arrive sur la page du match et confirme en un clic (prénom pré-rempli si cookie)
- **Zero app install** : PWA uniquement, pas d'app store
- **Couleurs** : palette sport (vert terrain, blanc, noir) — garder simple
- **Animations** : transition satisfaisante quand les équipes sont révélées (genre card flip ou draft pick)
- **Responsive** : desktop = dashboard organisateur, mobile = vue joueur

## 8. Métriques de validation

Seuils pour considérer le MVP validé (4 semaines après lancement) :

| Métrique | Seuil | Pourquoi |
|----------|-------|----------|
| Matchs organisés | ≥ 10 | Preuve d'usage récurrent |
| Joueurs uniques | ≥ 30 | Au-delà du cercle immédiat |
| Taux de RSVP via lien (vs ajout manuel) | ≥ 50% | Le flow sans-compte fonctionne |
| Taux de notation post-match | ≥ 30% | Le feedback loop a de la valeur |
| Rétention organisateur S2 → S4 | ≥ 60% | L'organisateur revient |
| Au moins 1 groupe créé par quelqu'un d'autre qu'Erwan | ✓ | Traction organique |

## 9. Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Personne ne crée de compte (tout le monde reste guest) | Pas de rétention mesurable | OK pour le MVP — le guest flow EST le produit. Le compte est un bonus. |
| L'algo de balancing est perçu comme injuste | Frustration, abandon | Transparence : afficher les scores des équipes. Override manuel pour l'organisateur. |
| Les gens ne notent pas après le match | Pas de data pour le balancing | Score par défaut 3/5. Gamification légère (badge "évaluateur"). Notifications de rappel. |
| WhatsApp link preview pas attractif | Faible taux de clic | OG meta tags soignés : image, titre accrocheur, nombre de places restantes |
| Un seul organisateur par groupe = SPOF | Si l'orga arrête, le groupe meurt | Permettre plusieurs organisateurs par groupe |

## 10. Phases futures (hors MVP)

- **Phase 2** : Payment-to-confirm (Stripe Checkout, Lydia si API dispo)
- **Phase 3** : Marketplace locale (trouver un match ouvert près de chez soi)
- **Phase 4** : Partenariats terrains (UrbanSoccer, Le Five, indépendants)
- **Phase 5** : Stats avancées (buts, assists, heatmaps si vidéo)

---

*Ce document est la source de vérité pour le MVP. Toute feature non listée ici est hors scope.*
