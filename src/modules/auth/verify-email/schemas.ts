import { z } from 'zod';

export const verifyEmailRequestSchema = z.object({
  email: z.string().email(),
  verificationCode: z.string().length(6)
});

export type VerifyEmailInput = z.infer<typeof verifyEmailRequestSchema>;
