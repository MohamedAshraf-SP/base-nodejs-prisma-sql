import { z } from "zod";

// ============================================
// [Template] Zod Schemas
// ============================================
// Define request validation schemas here.
// These are used by the `validate` middleware in the router.
//
// TIP: One schema per request shape. Name them after the operation:
//      createTemplateSchema, updateTemplateSchema, etc.

export const createTemplateSchema = z.object({
  // Example:
  // name: z.string().min(1).max(255),
  // email: z.string().email(),
});

export const updateTemplateSchema = z.object({
  // All fields optional for partial updates
  // name: z.string().min(1).max(255).optional(),
});

// Re-export inferred types if needed
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
