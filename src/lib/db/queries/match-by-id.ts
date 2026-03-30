"use server";

import { db } from "@/db";
import { matches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getMatchPlayers, getConfirmedCount, getWaitlistCount } from "./matches";

/**
 * Get a match by ID
 * Returns the match or throws 404 if not found
 *
 * @param id - Match UUID
 * @returns Match object
 * @throws notFound() if match doesn't exist
 */
export async function getMatchById(id: string) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);

  if (!match) {
    notFound();
  }

  return match;
}

/**
 * Get match with full player data and counts
 * Returns match, players, confirmed count, and waitlist count
 *
 * @param id - Match UUID
 * @returns Object with match, players, confirmedCount, waitlistCount
 * @throws notFound() if match doesn't exist
 */
export async function getMatchWithPlayers(id: string) {
  const match = await getMatchById(id);

  const [players, confirmedCount, waitlistCount] = await Promise.all([
    getMatchPlayers(id),
    getConfirmedCount(id),
    getWaitlistCount(id),
  ]);

  return {
    match,
    players,
    confirmedCount,
    waitlistCount,
  };
}
