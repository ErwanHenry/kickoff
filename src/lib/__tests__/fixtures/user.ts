import type { User } from '@/db/schema';

/**
 * User fixtures for merge and email notification tests
 *
 * These fixtures provide realistic test data covering:
 * - Users with email addresses
 * - Users without email (guests)
 * - Newly registered users
 */

export const userFixtures = {
  userWithEmail: {
    id: crypto.randomUUID(),
    name: 'Karim',
    email: 'karim@test.com',
  } as User,

  userWithoutEmail: {
    id: crypto.randomUUID(),
    name: 'Guest Player',
    email: null,
  } as User,

  newRegisteredUser: {
    id: crypto.randomUUID(),
    name: 'Thomas',
    email: 'thomas@test.com',
  } as User,
};

export const users = Object.values(userFixtures);

/**
 * Guest tokens for merge tests
 * These simulate cookies stored on guest devices
 */
export const guestTokens = {
  valid: 'abc123def4',
  expired: 'old123',
};
