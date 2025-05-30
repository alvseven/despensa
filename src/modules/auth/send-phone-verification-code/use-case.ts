import type { SendPhoneVerificationCodeInput } from './schemas.ts';

import { envs } from '@/shared/config/env.ts';
import { SAO_PAULO_TIME_ZONE } from '@/shared/constants/time-zone.ts';
import { validationRepository } from '@/shared/database/repositories/validations.ts';
import { generateOTPCode } from '@/shared/helpers/generate-otp-code.ts';
import { snsClient } from '@/shared/infra/aws/sns-client.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { PublishCommand } from '@aws-sdk/client-sns';
import { TZDate } from '@date-fns/tz';
import { addMinutes } from 'date-fns';

export async function sendPhoneVerificationCode({ phoneNumber }: SendPhoneVerificationCodeInput) {
  const { createValidation, getValidationByIdentifier, setValidationCodeAsExpired } =
    validationRepository();

  const otp = generateOTPCode();
  const timezoneDate = new TZDate(new Date(), SAO_PAULO_TIME_ZONE);

  const validationAlreadyExists = await getValidationByIdentifier(phoneNumber);

  if (validationAlreadyExists) {
    await setValidationCodeAsExpired(validationAlreadyExists.code);
  }

  await createValidation({
    code: otp,
    identifier: phoneNumber,
    type: 'phone',
    expiresAt: addMinutes(timezoneDate, envs.SMS_VERIFICATION_CODE_EXPIRES_IN)
  });

  await snsClient.send(
    new PublishCommand({
      Message: `Despensa: Por favor, confirme seu número de telefone digitando o código: ${otp}`,
      PhoneNumber: phoneNumber
    })
  );

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
