import { z } from 'zod';

export const getProductByIdRequestSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid()
});

export type GetProductByIdInput = z.infer<typeof getProductByIdRequestSchema>;
