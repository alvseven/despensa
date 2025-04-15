import { z } from 'zod';

export const verifyEmailRequestSchema = z.object({
  email: z.string(),
  verificationCode: z.string()
});

export type VerifyEmailInput = z.infer<typeof verifyEmailRequestSchema>;
