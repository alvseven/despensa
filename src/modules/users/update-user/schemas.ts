import { z } from 'zod';

import {
  oneLowerCaseLetterRegex,
  oneNumberRegex,
  oneSpecialCharacterRegex,
  oneUpperCaseLetterRegex
} from '@/shared/constants/password.ts';

export const updateUserByIdRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  password: z
    .string({
      required_error: "The field 'password' is required",
      invalid_type_error: "The field 'password' should be a string"
    })
    .min(8, {
      message: 'The password is required and must be at least 8 characters long.'
    })
    .regex(oneUpperCaseLetterRegex, 'At least one uppercase letter is required')
    .regex(oneLowerCaseLetterRegex, 'At least one lowercase letter is required')
    .regex(oneNumberRegex, 'At least one number is required')
    .regex(oneSpecialCharacterRegex, 'At least one special character is required')
    .optional()
});

export type UpdateUserByIdInput = z.infer<typeof updateUserByIdRequestSchema>;
