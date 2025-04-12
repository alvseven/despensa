import { z } from 'zod';

export const authenticateUserRequestSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type AuthenticateUserInput = z.infer<typeof authenticateUserRequestSchema>;
