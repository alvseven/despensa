import { sendSMSNotification } from '@/modules/notifications/send-sms-notification/use-case.ts';
import type { SendPhoneVerificationCodeInput } from './schemas.ts';

import { envs } from '@/shared/config/env.ts';
import { validationRepository } from '@/shared/database/repositories/validations.ts';
import { generateOTPCode } from '@/shared/helpers/generate-otp-code.ts';
import { snsClient } from '@/shared/infra/aws/sns-client.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { PublishCommand } from '@aws-sdk/client-sns';
import { addMinutes } from 'date-fns';

export async function sendPhoneVerificationCode({ phoneNumber }: SendPhoneVerificationCodeInput) {
  const { createValidation } = validationRepository();

  const { otp } = generateOTPCode();

  await createValidation({
    code: otp,
    identifier: phoneNumber,
    type: 'phone',
    expiresAt: addMinutes(new Date(), envs.SMS_EXPIRES_IN)
  });

  await snsClient.send(
    new PublishCommand({
      Message: `Por favor, confirme seu número de telefone digitando o código: ${otp}`,
      PhoneNumber: phoneNumber
    })
  );

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
