import { z } from 'zod';

export const softDeleteUserByIdRequestSchema = z.object({
  id: z.string().uuid()
});

export type SoftDeleteUserByIdInput = z.infer<typeof softDeleteUserByIdRequestSchema>;
