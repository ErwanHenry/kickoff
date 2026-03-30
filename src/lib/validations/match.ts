import { z } from "zod";

/**
 * Match creation validation schema
 * Per CONTEXT.md decisions D-01 through D-07
 */
export const matchCreateSchema = z
  .object({
    title: z.string().max(100).optional(),
    location: z.string().min(1, "Le lieu est requis").max(200),
    date: z.coerce.date(),
    maxPlayers: z
      .number()
      .min(6, "Minimum 6 joueurs")
      .max(22, "Maximum 22 joueurs")
      .default(14),
    minPlayers: z
      .number()
      .min(4, "Minimum 4 joueurs")
      .max(20, "Maximum 20 joueurs")
      .default(10),
    deadline: z.coerce.date().optional(),
    recurrence: z.enum(["none", "weekly"]).default("none"),
    groupId: z.string().uuid().optional(),
  })
  .refine((data) => data.minPlayers <= data.maxPlayers, {
    message: "Le minimum de joueurs doit être inférieur ou égal au maximum",
    path: ["minPlayers"],
  })
  .refine((data) => {
    if (!data.deadline) return true;
    return data.deadline < data.date;
  }, {
    message: "La deadline doit être avant la date du match",
    path: ["deadline"],
  });

export type MatchCreateInput = z.infer<typeof matchCreateSchema>;

/**
 * Match closure validation schema
 * Per CONTEXT.md decisions D-04 through D-10
 * Validates score fields, attendance marking, and optional match summary
 */
export const matchCloseSchema = z.object({
  matchId: z.string().uuid("Match ID invalide"),
  scoreTeamA: z.number().int().min(0).max(99, "Score doit être entre 0 et 99"),
  scoreTeamB: z.number().int().min(0).max(99, "Score doit être entre 0 et 99"),
  matchSummary: z.string().max(500, "Le résumé ne peut pas dépasser 500 caractères").optional(),
  attendance: z.array(
    z.object({
      playerId: z.string().uuid("ID du joueur invalide"),
      present: z.boolean(),
    })
  ).min(1, "Au moins un joueur doit être marqué"),
});

export type MatchCloseInput = z.infer<typeof matchCloseSchema>;
