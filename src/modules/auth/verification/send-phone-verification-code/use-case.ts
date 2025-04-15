import { sendSMSNotification } from '@/modules/notifications/send-sms-notification/use-case.ts';
import type { SendPhoneVerificationCodeInput } from './schemas.ts';

import { validationRepository } from '@/shared/database/repositories/validation.ts';
import { snsClient } from '@/shared/infra/aws/sns-client.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { PublishCommand } from '@aws-sdk/client-sns';

export async function sendPhoneVerificationCode({ phoneNumber }: SendPhoneVerificationCodeInput) {
  const { createValidation } = validationRepository();

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  await createValidation({
    code: verificationCode,
    identifier: phoneNumber,
    type: 'phone'
  });

  await snsClient.send(
    new PublishCommand({
      Message: `Verify your phone number by entering the code: ${verificationCode}`,
      PhoneNumber: phoneNumber
    })
  );

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
