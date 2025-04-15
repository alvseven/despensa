import { z } from 'zod';

export const sendEmailVerificationCodeRequestSchema = z.object({
  email: z.string()
});

export type SendEmailVerificationCodeInput = z.infer<typeof sendEmailVerificationCodeRequestSchema>;
