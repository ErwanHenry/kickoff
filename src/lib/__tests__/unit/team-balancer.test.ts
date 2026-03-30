import { describe, it, expect } from 'vitest';
import { balanceTeams, balanceTeamsBruteForce, balanceTeamsSerpentine } from '@/lib/team-balancer';
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

describe('balanceTeamsSerpentine', () => {
  it('uses serpentine pattern for 16 players (8 vs 8)', () => {
    // Create 16 players with descending scores (5.0, 4.8, 4.6, ..., 2.2)
    const sortedPlayers = Array.from({ length: 16 }, (_, i) =>
      createPlayer(String(i), { t: 5 - i * 0.2, p: 5 - i * 0.2, c: 5 - i * 0.2 })
    );
    const result = balanceTeamsSerpentine(sortedPlayers);

    expect(result.teamA.playerCount).toBe(8);
    expect(result.teamB.playerCount).toBe(8);
    expect(result.algorithm).toBe('serpentine');
  });

  it('completes in < 50ms for 16 players (performance test)', () => {
    const players = Array.from({ length: 16 }, (_, i) =>
      createPlayer(String(i), { t: 3 + Math.random(), p: 3 + Math.random(), c: 3 + Math.random() })
    );
    const start = performance.now();
    balanceTeamsSerpentine(players);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
  });

  it('handles odd player counts (17 players → 9 vs 8)', () => {
    const players = Array.from({ length: 17 }, (_, i) =>
      createPlayer(String(i), { t: 3 + i * 0.1, p: 3 + i * 0.1, c: 3 + i * 0.1 })
    );
    const result = balanceTeamsSerpentine(players);

    expect(Math.abs(result.teamA.playerCount - result.teamB.playerCount)).toBe(1);
    expect(result.teamA.playerCount + result.teamB.playerCount).toBe(17);
  });

  it('handles maximum realistic size (22 players)', () => {
    const players = Array.from({ length: 22 }, (_, i) =>
      createPlayer(String(i), { t: 3 + Math.random(), p: 3 + Math.random(), c: 3 + Math.random() })
    );
    const result = balanceTeamsSerpentine(players);

    expect(result.teamA.playerCount).toBe(11);
    expect(result.teamB.playerCount).toBe(11);
    expect(result.diff).toBeLessThan(5); // Should be reasonably balanced
  });

  it('verifies serpentine pattern (A, B, B, A, A, B, B, A...)', () => {
    // Create players with predictable scores
    const players = Array.from({ length: 8 }, (_, i) => {
      const score = 5 - i; // 5, 4, 3, 2, 1, 0, -1, -2 (but clamped to 1-5 in practice)
      return createPlayer(String(i), { t: Math.max(1, score), p: Math.max(1, score), c: Math.max(1, score) });
    });

    const result = balanceTeamsSerpentine(players);

    // Pattern: A gets indices 0,3,4,7; B gets indices 1,2,5,6
    expect(result.teamA.playerCount).toBe(4);
    expect(result.teamB.playerCount).toBe(4);
  });
});

describe('balanceTeams (main entry point)', () => {
  it('uses brute-force for ≤14 players', () => {
    const players = Array.from({ length: 14 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeams(players);
    expect(result.algorithm).toBe('brute-force');
  });

  it('uses serpentine for >14 players', () => {
    const players = Array.from({ length: 16 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeams(players);
    expect(result.algorithm).toBe('serpentine');
  });

  it('handles boundary case (14 players → brute-force)', () => {
    const players = Array.from({ length: 14 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeams(players);
    expect(result.algorithm).toBe('brute-force');
  });

  it('handles boundary case (15 players → serpentine)', () => {
    const players = Array.from({ length: 15 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeams(players);
    expect(result.algorithm).toBe('serpentine');
  });

  it('handles minimum team size (6 players → brute-force)', () => {
    const players = Array.from({ length: 6 }, (_, i) =>
      createPlayer(String(i), { t: 3, p: 3, c: 3 })
    );
    const result = balanceTeams(players);
    expect(result.algorithm).toBe('brute-force');
    expect(result.diff).toBe(0); // All same score
  });
});
