import { z } from 'zod';

export const deleteProductRequestSchema = z.object({
  accountId: z.string().uuid(),
  id: z.string().uuid()
});

export type DeleteProductInput = z.infer<typeof deleteProductRequestSchema>;
