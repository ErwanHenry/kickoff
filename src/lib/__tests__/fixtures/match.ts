import { nanoid } from 'nanoid';
import type { Match } from '@/db/schema';

/**
 * Match fixtures for OG image and email notification tests
 *
 * These fixtures provide realistic test data covering:
 * - Matches with and without titles
 * - Long location names (truncation testing)
 * - Special characters (emoji, accents)
 * - Various dates and player counts
 */

export const matchFixtures = {
  matchWithTitle: {
    id: crypto.randomUUID(),
    title: 'Foot du mardi',
    location: 'UrbanSoccer Nice',
    date: new Date('2026-04-08T20:00:00Z'),
    maxPlayers: 14,
    shareToken: nanoid(10),
    status: 'open',
  } as Match,

  matchWithoutTitle: {
    id: crypto.randomUUID(),
    title: null,
    location: 'Le Five',
    date: new Date('2026-04-15T19:00:00Z'),
    maxPlayers: 10,
    shareToken: nanoid(10),
    status: 'open',
  } as Match,

  matchWithLongLocation: {
    id: crypto.randomUUID(),
    title: 'Match amical',
    location: 'UrbanSoccer Nice Étoile - Very Long Name That Exceeds Twenty Five Characters',
    date: new Date('2026-04-08T20:00:00Z'),
    maxPlayers: 12,
    shareToken: nanoid(10),
    status: 'open',
  } as Match,

  matchWithSpecialChars: {
    id: crypto.randomUUID(),
    title: 'Match ⚽ duété',
    location: 'Stade de France',
    date: new Date('2026-07-14T21:00:00Z'),
    maxPlayers: 22,
    shareToken: nanoid(10),
    status: 'open',
  } as Match,
};

export const matches = Object.values(matchFixtures);
