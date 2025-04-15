import { z } from 'zod';

export const verifyPhoneNumberRequestSchema = z.object({
  phoneNumber: z.string(),
  verificationCode: z.string()
});

export type VerifyPhoneNumberInput = z.infer<typeof verifyPhoneNumberRequestSchema>;
