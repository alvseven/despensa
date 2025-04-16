import { usersRepository } from '@/shared/database/repositories/users.ts';
import type { VerifyPhoneNumberInput } from './schemas.ts';

import { validationRepository } from '@/shared/database/repositories/validations.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { isAfter } from 'date-fns';

export async function verifyPhoneNumber({ phoneNumber, verificationCode }: VerifyPhoneNumberInput) {
  const { getUserByPhoneNumber, setUserPhoneVerified } = usersRepository();
  const { getValidationByCode } = validationRepository();
  const userFound = await getUserByPhoneNumber(phoneNumber);

  if (!userFound || userFound.isPhoneVerified) {
    return errorResponse('Invalid credentials', STATUS_CODES.UNAUTHORIZED);
  }

  const verificationCodeFound = await getValidationByCode(verificationCode);

  if (!verificationCodeFound) {
    return errorResponse('Invalid verification code', STATUS_CODES.UNAUTHORIZED);
  }

  const isVerificationCodeValid = verificationCodeFound.identifier === phoneNumber;

  const isCodeUsed = verificationCodeFound.usedAt;

  const isCodeExpired = isAfter(verificationCodeFound.expiresAt, new Date());

  if (!isVerificationCodeValid || isCodeUsed || isCodeExpired) {
    return errorResponse('Invalid verification code', STATUS_CODES.UNAUTHORIZED);
  }

  await setUserPhoneVerified(userFound.id);

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
