import { z } from 'zod';

export const createProductRequestSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  buyedAt: z.string(), // TODO - add date validation (it can be in the future) format: YYYY-MM-DD
  category: z.string(),
  expiresAt: z.string() // TODO - add date validation (it can be in the past) format: YYYY-MM-DD
});

export type CreateProductInput = z.infer<typeof createProductRequestSchema>;
