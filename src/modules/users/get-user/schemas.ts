import { z } from 'zod';

export const getUserByIdRequestSchema = z.object({
  id: z.string().uuid()
});

export type GetUserByIdInput = z.infer<typeof getUserByIdRequestSchema>;
