import { z } from 'zod';

export const sendPhoneVerificationCodeRequestSchema = z.object({
  phoneNumber: z.string()
});

export type SendPhoneVerificationCodeInput = z.infer<typeof sendPhoneVerificationCodeRequestSchema>;
