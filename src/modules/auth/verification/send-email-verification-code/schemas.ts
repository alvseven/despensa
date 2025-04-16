import { z } from 'zod';

export const sendEmailVerificationCodeRequestSchema = z.object({
  email: z.string().email()
});

export type SendEmailVerificationCodeInput = z.infer<typeof sendEmailVerificationCodeRequestSchema>;
