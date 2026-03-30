import { describe, it, expect } from 'vitest';
import { calculatePlayerScore } from '@/lib/team-balancer';
import type { Player } from '@/lib/team-balancer';

describe('calculatePlayerScore', () => {
  it('calculates weighted score correctly (4, 3, 2 → 3.1)', () => {
    const player: Player = {
      id: '1',
      name: 'Test',
      avgTechnique: 4,
      avgPhysique: 3,
      avgCollectif: 2,
      totalRatings: 5,
    };
    expect(calculatePlayerScore(player)).toBe(3.1); // 4*0.4 + 3*0.3 + 2*0.3 = 1.6 + 0.9 + 0.6 = 3.1
  });

  it('calculates score for perfect player (5, 5, 5 → 5.0)', () => {
    const player: Player = {
      id: '1',
      name: 'Perfect',
      avgTechnique: 5,
      avgPhysique: 5,
      avgCollectif: 5,
      totalRatings: 10,
    };
    expect(calculatePlayerScore(player)).toBe(5.0); // 5*0.4 + 5*0.3 + 5*0.3 = 2.0 + 1.5 + 1.5 = 5.0
  });

  it('calculates score for weak player (1, 1, 1 → 1.0)', () => {
    const player: Player = {
      id: '1',
      name: 'Weak',
      avgTechnique: 1,
      avgPhysique: 1,
      avgCollectif: 1,
      totalRatings: 3,
    };
    expect(calculatePlayerScore(player)).toBe(1.0); // 1*0.4 + 1*0.3 + 1*0.3 = 0.4 + 0.3 + 0.3 = 1.0
  });

  it('defaults null/zero stats to 3.0', () => {
    const player: Player = {
      id: '1',
      name: 'New',
      avgTechnique: 0,
      avgPhysique: 0,
      avgCollectif: 0,
      totalRatings: 0,
    };
    expect(calculatePlayerScore(player)).toBe(3.0); // 3*0.4 + 3*0.3 + 3*0.3 = 1.2 + 0.9 + 0.9 = 3.0
  });

  it('handles decimal strings from database (Postgres Decimal type)', () => {
    const player: Player = {
      id: '1',
      name: 'DB Player',
      avgTechnique: '4.50',
      avgPhysique: '3.20',
      avgCollectif: '2.80',
      totalRatings: 5,
    };
    const result = calculatePlayerScore(player);
    expect(result).toBeCloseTo(4.5 * 0.4 + 3.2 * 0.3 + 2.8 * 0.3, 2);
  });

  it('handles mixed number and string types', () => {
    const player: Player = {
      id: '1',
      name: 'Mixed',
      avgTechnique: 4, // number
      avgPhysique: '3.5', // string
      avgCollectif: 2, // number
      totalRatings: 3,
    };
    const result = calculatePlayerScore(player);
    expect(result).toBeCloseTo(4 * 0.4 + 3.5 * 0.3 + 2 * 0.3, 2);
  });

  it('returns 3.0 for all undefined stats', () => {
    const player: Player = {
      id: '1',
      name: 'Undefined',
      avgTechnique: undefined as any,
      avgPhysique: undefined as any,
      avgCollectif: undefined as any,
      totalRatings: 0,
    };
    expect(calculatePlayerScore(player)).toBe(3.0);
  });
});
