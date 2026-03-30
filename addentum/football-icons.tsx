// src/components/icons/football-icons.tsx
// Pictogrammes football — Design system kickoff
// Usage : <FootballIcon name="centerCircle" size={24} className="text-pitch" />

import { type SVGProps, type ReactElement } from "react";

type IconName =
  | "centerCircle"  // Match / Événement
  | "ball"          // Score / Rating
  | "boot"          // Joueurs / RSVP
  | "goal"          // Résultats
  | "whistle"       // Notifications
  | "cornerFlag"    // Groupes
  | "lineRef"       // Waitlist / Règles
  | "jersey"        // Équipe assignée
  | "card"          // Statuts (carton)
  | "pitch"         // Dashboard
  | "star"          // Classement
  | "chrono";       // Deadline / Timing

interface FootballIconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, ReactElement> = {
  // Rond central = Match / Événement
  centerCircle: (
    <>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
    </>
  ),

  // Ballon = Score / Rating
  ball: (
    <>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M24 6L30 16H18L24 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M24 42L18 32H30L24 42Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M7 18L14 24L7 30" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M41 18L34 24L41 30" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <polygon points="20,18 28,18 31,25 26,31 22,31 17,25" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
    </>
  ),

  // Crampons = Joueurs / RSVP
  boot: (
    <>
      <path d="M10 14C10 14 12 10 18 10C24 10 26 14 26 14L38 18C40 19 42 22 40 26L36 32H8L6 24C5 20 7 16 10 14Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="12" y1="32" x2="12" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="32" x2="20" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="32" x2="28" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="32" x2="34" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),

  // Cage / But = Résultats
  goal: (
    <>
      <path d="M6 38V10H42V38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="6" y1="10" x2="42" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="10" x2="14" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="22" y1="10" x2="22" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="30" y1="10" x2="30" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="38" y1="10" x2="38" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="6" y1="18" x2="42" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="6" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="6" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </>
  ),

  // Sifflet = Notifications
  whistle: (
    <>
      <circle cx="16" cy="28" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M24 22L40 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 10L42 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="28" r="3" fill="currentColor" />
      <path d="M8 18C6 16 6 14 8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M5 16C2 13 2 10 5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </>
  ),

  // Drapeau de corner = Groupes
  cornerFlag: (
    <>
      <line x1="12" y1="8" x2="12" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 8L36 14L12 22Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 42C4 42 8 36 12 36C16 36 20 42 20 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </>
  ),

  // Arbitre de touche = Waitlist
  lineRef: (
    <>
      <circle cx="24" cy="10" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M24 15V30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 22H30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 30L16 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 30L32 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 22L38 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="8" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
    </>
  ),

  // Maillot = Équipe
  jersey: (
    <>
      <path d="M16 6L8 12L4 20L10 22L12 16V40H36V16L38 22L44 20L40 12L32 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <path d="M16 6C16 6 18 12 24 12C30 12 32 6 32 6" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),

  // Carton = Statut
  card: (
    <>
      <rect x="12" y="6" width="24" height="36" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.12" />
    </>
  ),

  // Terrain vue dessus = Dashboard
  pitch: (
    <>
      <rect x="4" y="8" width="40" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="1.5" fill="currentColor" />
      <rect x="4" y="16" width="8" height="16" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="36" y="16" width="8" height="16" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  ),

  // Étoile = Rating/Classement
  star: (
    <>
      <path d="M24 6L29.5 17.2L42 19.1L33 27.8L35 40.2L24 34.4L13 40.2L15 27.8L6 19.1L18.5 17.2L24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
    </>
  ),

  // Chronomètre = Deadline
  chrono: (
    <>
      <circle cx="24" cy="26" r="16" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <line x1="20" y1="6" x2="28" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="6" x2="24" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="26" x2="24" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="26" x2="32" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2" fill="currentColor" />
    </>
  ),
};

export function FootballIcon({ name, size = 24, ...props }: FootballIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export type { IconName, FootballIconProps };
