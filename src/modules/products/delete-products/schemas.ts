import { z } from 'zod';

export const deleteProductRequestSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid()
});

export type DeleteProductInput = z.infer<typeof deleteProductRequestSchema>;
