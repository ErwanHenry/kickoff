"use server";

import { z } from "zod";
import { db } from "@/db";
import { matches, matchPlayers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { matchCloseSchema } from "@/lib/validations/match";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Close a match by marking attendance, entering score, and changing status to "played"
 * Per CONTEXT.md decisions D-11 through D-15, POST-04 through POST-05
 *
 * Only the match creator can close the match
 * Updates match status to "played" and saves score/summary
 * Updates player attendance and sets "no_show" status for absent players
 */
export async function closeMatch(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { error: "Non authentifié" };
    }

    // Parse and validate input
    const input = matchCloseSchema.parse({
      matchId: formData.get("matchId"),
      scoreTeamA: Number(formData.get("scoreTeamA")),
      scoreTeamB: Number(formData.get("scoreTeamB")),
      matchSummary: formData.get("matchSummary") || undefined,
      attendance: JSON.parse(formData.get("attendance") as string),
    });

    // Get match and verify ownership (D-12: only creator can close)
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, input.matchId))
      .limit(1);

    if (!match) {
      return { error: "Match non trouvé" };
    }

    if (match.createdBy !== session.user.id) {
      return { error: "Seul le créateur peut clôturer ce match" };
    }

    // Use transaction to ensure atomic updates
    await db.transaction(async (tx) => {
      // Update match status to "played" (POST-04)
      await tx
        .update(matches)
        .set({
          status: "played",
          scoreTeamA: input.scoreTeamA,
          scoreTeamB: input.scoreTeamB,
          matchSummary: input.matchSummary || null,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, input.matchId));

      // Update all confirmed players' attendance and status
      for (const record of input.attendance) {
        if (record.present) {
          // Present: attended=true, status stays "confirmed"
          await tx
            .update(matchPlayers)
            .set({ attended: true })
            .where(
              and(
                eq(matchPlayers.id, record.playerId),
                eq(matchPlayers.matchId, input.matchId)
              )
            );
        } else {
          // Absent: attended=false, status="no_show" (POST-05)
          await tx
            .update(matchPlayers)
            .set({
              attended: false,
              status: "no_show",
            })
            .where(
              and(
                eq(matchPlayers.id, record.playerId),
                eq(matchPlayers.matchId, input.matchId)
              )
            );
        }
      }
    });

    // Revalidate paths
    revalidatePath(`/match/${input.matchId}`);
    revalidatePath(`/match/${input.matchId}/attendance`);
    revalidatePath("/dashboard");

    return { success: true, matchId: input.matchId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Données invalides" };
    }
    console.error("Close match error:", error);
    return { error: "Erreur lors de la clôture du match" };
  }
}
