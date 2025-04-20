import { VerifyEmailTemplate } from '@/shared/config/email-templates/verify-email.tsx';
import type { SendEmailVerificationCodeInput } from './schemas.ts';

import { envs } from '@/shared/config/env.ts';
import { validationRepository } from '@/shared/database/repositories/validations.ts';
import { generateOTPCode } from '@/shared/helpers/generate-otp-code.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { mailer } from '@/shared/infra/mailer/index.ts';
import { TZDate } from '@date-fns/tz';
import { render } from '@react-email/components';
import { addMinutes } from 'date-fns';
import { TIME_ZONE } from '@/shared/constants/time-zone.ts';

export async function sendEmailVerificationCode({ name, email }: SendEmailVerificationCodeInput) {
  const { createValidation, getValidationByIdentifier, setValidationCodeAsExpired } =
    validationRepository();

  const validationAlreadyExists = await getValidationByIdentifier(email);

  if (validationAlreadyExists) {
    await setValidationCodeAsExpired(validationAlreadyExists.code);
  }

  const otp = generateOTPCode();
  const timezoneDate = new TZDate(new Date(), TIME_ZONE);

  await createValidation({
    code: otp,
    identifier: email,
    type: 'email',
    expiresAt: addMinutes(timezoneDate, envs.EMAIL_VERIFICATION_CODE_EXPIRES_IN)
  });

  const emailMessage = await render(VerifyEmailTemplate({ name, verificationCode: otp }));

  await mailer.emails.send({
    from: 'Despensa <onboarding@resend.dev>',
    to: [email],
    subject: 'Confirme seu email - Despensa',
    html: emailMessage
  });

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
