import { usersRepository } from '@/shared/database/repositories/users.ts';
import type { VerifyEmailInput } from './schemas.ts';

import { validationRepository } from '@/shared/database/repositories/validations.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { isAfter } from 'date-fns';

export async function verifyEmail({ email, verificationCode }: VerifyEmailInput) {
  const { getUserByEmail, setUserEmailVerified } = usersRepository();
  const { getValidationByCode } = validationRepository();
  const userFound = await getUserByEmail(email);

  if (!userFound || userFound.isEmailVerified) {
    return errorResponse('Invalid credentials', STATUS_CODES.UNAUTHORIZED);
  }

  const verificationCodeFound = await getValidationByCode(verificationCode);

  if (!verificationCodeFound) {
    return errorResponse('Invalid verification code', STATUS_CODES.UNAUTHORIZED);
  }

  const isVerificationCodeValid =
    verificationCodeFound.code === verificationCode && verificationCodeFound.identifier === email;

  const isCodeUsed = verificationCodeFound.usedAt;

  const isCodeExpired = isAfter(verificationCodeFound.expiresAt, new Date());

  if (!isVerificationCodeValid || isCodeUsed || isCodeExpired) {
    return errorResponse('Invalid verification code', STATUS_CODES.UNAUTHORIZED);
  }

  await setUserEmailVerified(userFound.id);

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
