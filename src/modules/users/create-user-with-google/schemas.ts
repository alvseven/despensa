import { z } from 'zod';

import { phoneNumberRegex } from '@/shared/constants/phone.ts';

export const createUserWithGoogleRequestSchema = z.object({
  code: z.string(),
  phoneNumber: z.string().regex(phoneNumberRegex, 'Invalid phone number') // phone number is beeing asked cuz google doesn't provide it
});

export type CreateUserWithGoogleInput = z.infer<typeof createUserWithGoogleRequestSchema>;
