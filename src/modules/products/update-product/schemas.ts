import { z } from 'zod';

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).optional(),
  buyedAt: z.string(), // TODO - add date validation (it can be in the future) format: YYYY-MM-DD
  category: z.string(),
  expiresAt: z.string() // TODO - add date validation (it can be in the past) format: YYYY-MM-DD
});

export type UpdateProductByIdInput = z.infer<typeof updateProductByIdRequestSchema>;
