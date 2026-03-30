"use server";

import { db } from "@/db";
import { matches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { generateShareToken } from "@/lib/utils/ids";
import { matchCreateSchema, type MatchCreateInput } from "@/lib/validations/match";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

/**
 * Create a new match (draft status)
 * Per CONTEXT.md D-08: Match starts in "draft" state
 */
export async function createMatch(input: MatchCreateInput) {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: "Non authentifié" };
  }

  // Validate input
  const validated = matchCreateSchema.parse(input);

  // Generate share token
  const shareToken = generateShareToken();

  // Insert match
  const [match] = await db
    .insert(matches)
    .values({
      title: validated.title,
      location: validated.location,
      date: validated.date,
      maxPlayers: validated.maxPlayers,
      minPlayers: validated.minPlayers,
      deadline: validated.deadline,
      recurrence: validated.recurrence,
      groupId: validated.groupId,
      shareToken,
      createdBy: session.user.id,
      status: "draft", // Per CONTEXT.md D-08
    })
    .returning();

  // Revalidate dashboard
  revalidatePath("/dashboard");

  return match;
}

/**
 * Publish a draft match (changes status from draft to open)
 * Per CONTEXT.md D-08: Creator clicks "Publier" to make it "open"
 */
export async function publishMatch(matchId: string) {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: "Non authentifié" };
  }

  // Verify user is the creator
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return { error: "Match non trouvé" };
  }

  if (match.createdBy !== session.user.id) {
    return { error: "Non autorisé" };
  }

  // Update status to open
  const [updated] = await db
    .update(matches)
    .set({ status: "open" })
    .where(eq(matches.id, matchId))
    .returning();

  // Revalidate paths
  revalidatePath("/dashboard");
  revalidatePath(`/match/${matchId}`);

  // Redirect to public match page
  redirect(`/m/${updated.shareToken}`);
}
