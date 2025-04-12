import { z } from 'zod';

export const getProductsRequestSchema = z.object({
  userId: z.string().uuid()
});

export type GetProductsInput = z.infer<typeof getProductsRequestSchema>;
