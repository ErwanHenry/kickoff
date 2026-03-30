import { describe, it, expect } from 'vitest';
import { balanceTeamsBruteForce } from '@/lib/team-balancer';
import type { Player } from '@/lib/team-balancer';

const createPlayer = (id: string, scores: { t: number; p: number; c: number }): Player => ({
  id,
  name: `Player ${id}`,
  avgTechnique: scores.t,
  avgPhysique: scores.p,
  avgCollectif: scores.c,
  totalRatings: 5,
});

describe('balanceTeamsBruteForce', () => {
  it('balances 10 players with diff ≤ 0.5', () => {
    const players = Array.from({ length: 10 }, (_, i) =>
      createPlayer(String(i), { t: 3 + Math.random(), p: 3 + Math.random(), c: 3 + Math.random() })
    );
    const result = balanceTeamsBruteForce(players);
    expect(result.diff).toBeLessThanOrEqual(0.5);
    expect(result.teamA.playerCount + result.teamB.playerCount).toBe(10);
    expect(result.algorithm).toBe('brute-force');
  });

  it('balances 14 players with diff ≤ 1.0', () => {
    const players = Array.from({ length: 14 }, (_, i) =>
      createPlayer(String(i), { t: 3 + Math.random(), p: 3 + Math.random(), c: 3 + Math.random() })
    );
    const result = balanceTeamsBruteForce(players);
    expect(result.diff).toBeLessThanOrEqual(1.0);
    expect(result.teamA.playerCount).toBe(7);
    expect(result.teamB.playerCount).toBe(7);
  });

  it('handles odd player counts (11 players → 6 vs 5)', () => {
    const players = Array.from({ length: 11 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeamsBruteForce(players);
    expect(Math.abs(result.teamA.playerCount - result.teamB.playerCount)).toBe(1);
    expect(result.teamA.playerCount + result.teamB.playerCount).toBe(11);
    // With odd players, one team has extra player, so diff equals that player's score (3.0)
    expect(result.diff).toBeCloseTo(3.0, 1);
  });

  it('perfectly balances all players with same score (3.0)', () => {
    const players = Array.from({ length: 12 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeamsBruteForce(players);
    expect(result.diff).toBe(0);
    expect(result.teamA.playerCount).toBe(6);
    expect(result.teamB.playerCount).toBe(6);
  });

  it('completes in < 100ms for 14 players (performance test)', () => {
    const players = Array.from({ length: 14 }, (_, i) =>
      createPlayer(String(i), { t: 3 + Math.random(), p: 3 + Math.random(), c: 3 + Math.random() })
    );
    const start = performance.now();
    const result = balanceTeamsBruteForce(players);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result.diff).toBeLessThanOrEqual(1.0);
  });

  it('handles extreme skill variance (1s vs 5s)', () => {
    // 3 strong players (score 5.0) and 3 weak players (score 1.0)
    const players: Player[] = [
      createPlayer('1', { t: 5, p: 5, c: 5 }),
      createPlayer('2', { t: 5, p: 5, c: 5 }),
      createPlayer('3', { t: 5, p: 5, c: 5 }),
      createPlayer('4', { t: 1, p: 1, c: 1 }),
      createPlayer('5', { t: 1, p: 1, c: 1 }),
      createPlayer('6', { t: 1, p: 1, c: 1 }),
    ];
    const result = balanceTeamsBruteForce(players);

    // Should split evenly: 2 strong + 1 weak on each team
    expect(result.teamA.playerCount).toBe(3);
    expect(result.teamB.playerCount).toBe(3);
    // Best split: [5+5+1=11] vs [5+1+1=7], diff = 4
    expect(result.diff).toBe(4);
  });

  it('handles minimum team size (6 players)', () => {
    const players = Array.from({ length: 6 }, (_, i) =>
      createPlayer(String(i), { t: 3 + i * 0.2, p: 3 + i * 0.2, c: 3 + i * 0.2 })
    );
    const result = balanceTeamsBruteForce(players);
    expect(result.teamA.playerCount).toBe(3);
    expect(result.teamB.playerCount).toBe(3);
    expect(result.diff).toBeLessThanOrEqual(0.5);
  });

  it('calculates total scores correctly', () => {
    const players = [
      createPlayer('1', { t: 4, p: 3, c: 2 }), // score: 3.1
      createPlayer('2', { t: 3, p: 3, c: 3 }), // score: 3.0
      createPlayer('3', { t: 2, p: 2, c: 2 }), // score: 2.0
      createPlayer('4', { t: 1, p: 1, c: 1 }), // score: 1.0
    ];
    const result = balanceTeamsBruteForce(players);

    // Best split: [3.1 + 1.0 = 4.1] vs [3.0 + 2.0 = 5.0], diff = 0.9
    // Or: [3.1 + 2.0 = 5.1] vs [3.0 + 1.0 = 4.0], diff = 1.1
    // Or: [3.0 + 1.0 = 4.0] vs [3.1 + 2.0 = 5.1], diff = 1.1
    expect(result.teamA.totalScore + result.teamB.totalScore).toBeCloseTo(9.1, 1);
  });
});
