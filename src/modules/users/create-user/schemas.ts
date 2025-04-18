import { z } from 'zod';

import { zodCustomErrorMap } from '@/shared/config/zod-custom-error-map.ts';
import {
  oneLowerCaseLetterRegex,
  oneNumberRegex,
  oneSpecialCharacterRegex,
  oneUpperCaseLetterRegex
} from '@/shared/constants/password.ts';
import { phoneNumberRegex } from '@/shared/constants/phone.ts';
export const createUserRequestSchema = z
  .object(
    {
      name: z.string().min(1),
      email: z.string().email(),
      phoneNumber: z.string().regex(phoneNumberRegex, 'Invalid phone number'),
      avatarUrl: z.string().url(),
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
        .regex(oneSpecialCharacterRegex, 'At least one special character is required'),
      confirmPassword: z.string().min(1, 'Password confirmation is required')
    },
    {
      errorMap: zodCustomErrorMap(['password'])
    }
  )
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'Passwords need to match',
    path: ['confirmPassword']
  });

export type CreateUserInput = z.infer<typeof createUserRequestSchema>;
