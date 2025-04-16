import { z } from 'zod';

import { phoneNumberRegex } from '@/shared/constants/phone.ts';

export const sendPhoneVerificationCodeRequestSchema = z.object({
  phoneNumber: z.string().regex(phoneNumberRegex)
});

export type SendPhoneVerificationCodeInput = z.infer<typeof sendPhoneVerificationCodeRequestSchema>;
