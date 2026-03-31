import { z } from "zod";

/**
 * Group creation validation schema
 * Per 08-CONTEXT.md: name (3-50 chars), slug auto-generated if not provided
 */
export const createGroupSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(50, "Le nom ne peut pas dépasser 50 caractères"),
  slug: z.string().min(3, "Le slug doit contenir au moins 3 caractères").max(50, "Le slug ne peut pas dépasser 50 caractères").optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
