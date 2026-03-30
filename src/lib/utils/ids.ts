import { nanoid } from "nanoid";

/**
 * Generate a unique share token for match sharing
 * @returns 10-character URL-safe string
 */
export function generateShareToken(): string {
  return nanoid(10);
}

/**
 * Generate a unique guest token for guest identification
 * @returns 10-character URL-safe string
 */
export function generateGuestToken(): string {
  return nanoid(10);
}
