import { z } from "zod";

export const createConstSchema = z.object({
  key: z.string().min(1, "Key is required").max(255),
  value: z.string().min(1, "Value is required"),
});

export const updateConstSchema = z.object({
  key: z.string().min(1).max(255).optional(),
  value: z.string().min(1).optional(),
});

export type CreateConstInput = z.infer<typeof createConstSchema>;
export type UpdateConstInput = z.infer<typeof updateConstSchema>;
