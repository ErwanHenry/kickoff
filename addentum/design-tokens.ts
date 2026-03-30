// src/lib/design-tokens.ts
// Tokens de design kickoff — source de vérité pour couleurs, fonts, spacing
// Ces valeurs sont aussi dans tailwind.config.ts, ce fichier sert pour l'usage en JS/TS

export const colors = {
  // Principales
  pitch: {
    DEFAULT: "#2D5016",  // Vert terrain — headers, CTAs, primary
    light: "#4A7A2E",    // Hover states
    dark: "#1A3009",     // Active states, shadows
  },
  lime: {
    DEFAULT: "#4ADE80",  // Accent — succès, confirmations
    glow: "#BBF7D0",     // Backgrounds légers
    dark: "#166534",     // Texte sur fond lime
  },
  chalk: {
    DEFAULT: "#F8FAF5",  // Background app — blanc cassé vert
    pure: "#FFFFFF",     // Cards, surfaces élevées
  },
  slate: {
    DEFAULT: "#1E293B",  // Texte principal
    mid: "#64748B",      // Texte secondaire
    light: "#CBD5E1",    // Bordures
    lighter: "#F1F5F9",  // Backgrounds hover
  },

  // Sémantiques (cartons)
  yellowCard: "#FACC15",   // Warning, attention
  redCard: "#EF4444",      // Erreur, no-show, danger
  whistle: "#3B82F6",      // Info, liens, notifications

  // Équipes
  teamA: "#2D5016",        // Équipe A = pitch
  teamB: "#3B82F6",        // Équipe B = bleu
} as const;

export const fonts = {
  sans: "'DM Sans', sans-serif",     // Corps & titres
  mono: "'Space Mono', monospace",    // Données, labels, scores
} as const;

// Google Fonts import URL
export const fontImportUrl =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap";

// Mapping picto → concept UX (pour référence dev)
export const iconMapping = {
  centerCircle: { usage: "Match / Événement",    where: "CTA créer match, nav, header page match" },
  ball:         { usage: "Score / Rating",        where: "Notation post-match, scores" },
  boot:         { usage: "Joueurs / RSVP",        where: "Bouton 'Je suis là !', liste confirmés" },
  goal:         { usage: "Résultats",             where: "Score final, historique résultats" },
  whistle:      { usage: "Notifications",         where: "Alertes, rappels, emails" },
  cornerFlag:   { usage: "Groupes",               where: "Nav groupes, création groupe" },
  lineRef:      { usage: "Waitlist / Règles",     where: "Badge waitlist, promotions" },
  jersey:       { usage: "Équipe assignée",       where: "Badge team A/B, draft" },
  card:         { usage: "Statuts",               where: "🟡 Warning 🔴 No-show 🟢 Confirmé" },
  pitch:        { usage: "Dashboard",             where: "Accueil, vue d'ensemble" },
  star:         { usage: "Classement",            where: "Leaderboard, profil joueur" },
  chrono:       { usage: "Deadline / Timing",     where: "Countdown, heure match" },
} as const;

// Badge configs par statut
export const statusBadges = {
  confirmed:  { bg: "bg-lime-glow",     text: "text-lime-dark",   icon: "boot" as const,    label: "Confirmé" },
  waitlisted: { bg: "bg-yellow-100",    text: "text-yellow-800",  icon: "lineRef" as const,  label: "Waitlist" },
  cancelled:  { bg: "bg-slate-100",     text: "text-slate-500",   icon: "card" as const,     label: "Annulé" },
  no_show:    { bg: "bg-red-100",       text: "text-red-800",     icon: "card" as const,     label: "No-show" },
  locked:     { bg: "bg-blue-100",      text: "text-blue-800",    icon: "whistle" as const,  label: "Locked" },
  open:       { bg: "bg-lime-glow",     text: "text-pitch",       icon: "centerCircle" as const, label: "Open" },
  full:       { bg: "bg-yellow-100",    text: "text-yellow-800",  icon: "chrono" as const,   label: "Complet" },
  played:     { bg: "bg-slate-100",     text: "text-slate-600",   icon: "goal" as const,     label: "Joué" },
  rated:      { bg: "bg-pitch",         text: "text-lime",        icon: "star" as const,     label: "Noté" },
} as const;

// Attendance rate → badge couleur
export const attendanceBadge = (rate: number) => {
  if (rate >= 90) return { emoji: "🟢", label: "Fiable", className: "text-green-600" };
  if (rate >= 70) return { emoji: "🟡", label: "Moyen",  className: "text-yellow-600" };
  return                 { emoji: "🔴", label: "Fragile", className: "text-red-600" };
};
