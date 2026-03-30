/**
 * Team Balancing Algorithm
 *
 * Implements intelligent team balancing using:
 * - Brute-force combinatorics for ≤14 players (optimal fairness)
 * - Serpentine draft fallback for >14 players (efficient approximation)
 *
 * Score calculation: technique 40%, physique 30%, collectif 30%
 */

export interface Player {
  id: string;
  name: string;
  avgTechnique: number | string; // Decimal from DB comes as string
  avgPhysique: number | string;
  avgCollectif: number | string;
  totalRatings: number;
}

export interface Team {
  players: Player[];
  totalScore: number;
  playerCount: number;
}

export interface BalanceResult {
  teamA: Team;
  teamB: Team;
  diff: number;
  algorithm: 'brute-force' | 'serpentine';
}

/**
 * Convert decimal value from database to number
 * Postgres returns Decimal type as string, need Number() conversion
 */
function toNumber(value: number | string): number {
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 3.0 : num;
}

/**
 * Calculate weighted score for a player
 * Weights: technique 40%, physique 30%, collectif 30%
 *
 * @param player - Player with stats
 * @returns Weighted score (1-5 range, typically 2.5-4.5)
 */
export function calculatePlayerScore(player: Player): number {
  const t = toNumber(player.avgTechnique) || 3.0;
  const p = toNumber(player.avgPhysique) || 3.0;
  const c = toNumber(player.avgCollectif) || 3.0;

  return t * 0.4 + p * 0.3 + c * 0.3;
}
