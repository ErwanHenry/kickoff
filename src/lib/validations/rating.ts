import { z } from "zod";

/**
 * Rating submission validation schema
 * Per PLAN 06-01 requirements: RATE-01 through RATE-07
 */
export const ratingSchema = z.object({
  matchId: z.string().uuid("Match ID invalide"),
  ratings: z.array(
    z.object({
      ratedId: z.string().min(1, "ID du joueur noté requis"),
      technique: z
        .number()
        .int("La technique doit être un entier")
        .min(1, "La technique doit être entre 1 et 5")
        .max(5, "La technique doit être entre 1 et 5"),
      physique: z
        .number()
        .int("Le physique doit être un entier")
        .min(1, "Le physique doit être entre 1 et 5")
        .max(5, "Le physique doit être entre 1 et 5"),
      collectif: z
        .number()
        .int("Le collectif doit être un entier")
        .min(1, "Le collectif doit être entre 1 et 5")
        .max(5, "Le collectif doit être entre 1 et 5"),
      comment: z
        .string()
        .max(280, "Le commentaire ne peut pas dépasser 280 caractères")
        .optional(),
    })
  ).min(1, "Au moins une note est requise"),
});

export type RatingInput = z.infer<typeof ratingSchema>;

/**
 * Single player rating input (for form state)
 */
export const playerRatingSchema = z.object({
  ratedId: z.string(),
  technique: z.number().min(1).max(5).default(3),
  physique: z.number().min(1).max(5).default(3),
  collectif: z.number().min(1).max(5).default(3),
  comment: z.string().max(280).optional(),
});

export type PlayerRatingInput = z.infer<typeof playerRatingSchema>;
