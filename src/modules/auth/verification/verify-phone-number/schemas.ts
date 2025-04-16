import { phoneNumberRegex } from '@/shared/constants/phone.ts';
import { z } from 'zod';

export const verifyPhoneNumberRequestSchema = z.object({
  phoneNumber: z.string().regex(phoneNumberRegex),
  verificationCode: z.string().length(6)
});

export type VerifyPhoneNumberInput = z.infer<typeof verifyPhoneNumberRequestSchema>;
