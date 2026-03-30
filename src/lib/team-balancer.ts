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

/**
 * Generate all combinations of n/2 players for team A
 * Uses bitmask approach for O(2^n) complexity
 *
 * @param players - All players to split
 * @returns All possible team A combinations
 */
function generateCombinations(players: Player[]): Player[][] {
  const n = players.length;
  const teamSize = Math.floor(n / 2);
  const combinations: Player[][] = [];

  // Generate all 2^n combinations using bitmask
  for (let mask = 0; mask < (1 << n); mask++) {
    // Count set bits to ensure exactly teamSize players
    const bitCount = mask.toString(2).split('1').length - 1;
    if (bitCount !== teamSize) continue;

    const teamA: Player[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        teamA.push(players[i]);
      }
    }
    combinations.push(teamA);
  }

  return combinations;
}

/**
 * Brute-force team balancing for ≤14 players
 * Time complexity: O(C(n, n/2) * n)
 * For 14 players: C(14, 7) = 3,432 combinations (~50ms)
 *
 * @param players - All players to balance
 * @returns Optimal team split with minimum score difference
 */
export function balanceTeamsBruteForce(players: Player[]): BalanceResult {
  const combinations = generateCombinations(players);
  let bestResult: BalanceResult | null = null;
  let minDiff = Infinity;

  for (const teamAPlayers of combinations) {
    const teamBPlayers = players.filter(p => !teamAPlayers.includes(p));

    const scoreA = teamAPlayers.reduce((sum, p) => sum + calculatePlayerScore(p), 0);
    const scoreB = teamBPlayers.reduce((sum, p) => sum + calculatePlayerScore(p), 0);
    const diff = Math.abs(scoreA - scoreB);

    if (diff < minDiff) {
      minDiff = diff;
      bestResult = {
        teamA: {
          players: teamAPlayers,
          totalScore: scoreA,
          playerCount: teamAPlayers.length,
        },
        teamB: {
          players: teamBPlayers,
          totalScore: scoreB,
          playerCount: teamBPlayers.length,
        },
        diff,
        algorithm: 'brute-force',
      };
    }
  }

  return bestResult!;
}
