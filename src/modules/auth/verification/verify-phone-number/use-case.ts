import { usersRepository } from '@/shared/database/repositories/users.ts';
import type { VerifyPhoneNumberInput } from './schemas.ts';

import { validationRepository } from '@/shared/database/repositories/validation.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function verifyPhoneNumber({ phoneNumber, verificationCode }: VerifyPhoneNumberInput) {
  const { getUserByPhoneNumber, setUserPhoneVerified } = usersRepository();
  const { getValidationByCode } = validationRepository();
  const userFound = await getUserByPhoneNumber(phoneNumber);

  if (!userFound) {
    return errorResponse('Invalid credentials', STATUS_CODES.UNAUTHORIZED);
  }

  const databaseVerificationCode = await getValidationByCode(verificationCode);

  const isVerificationCodeValid =
    databaseVerificationCode.code === verificationCode &&
    databaseVerificationCode.identifier === phoneNumber;

  if (!isVerificationCodeValid) {
    return errorResponse('Invalid verification code', STATUS_CODES.UNAUTHORIZED);
  }

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
