import { z } from 'zod';

export const sendEmailVerificationCodeRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

export type SendEmailVerificationCodeInput = z.infer<typeof sendEmailVerificationCodeRequestSchema>;
