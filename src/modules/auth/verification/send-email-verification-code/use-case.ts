import { VerifyEmailTemplate } from '@/email-templates/verify-email.tsx';
import type { SendEmailVerificationCodeInput } from './schemas.ts';

import { validationRepository } from '@/shared/database/repositories/validation.ts';
import { successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { mailer } from '@/shared/infra/mailer/index.ts';
import { render } from '@react-email/components';

export async function sendEmailVerificationCode({ email }: SendEmailVerificationCodeInput) {
  const { createValidation } = validationRepository();

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  await createValidation({
    code: verificationCode,
    identifier: email,
    type: 'email'
  });

  const emailMessage = await render(VerifyEmailTemplate({ verificationCode }));

  await mailer.emails.send({
    from: 'Despensa <onboarding@resend.dev>',
    to: [email],
    subject: 'Confirme seu email - Despensa',
    html: emailMessage
  });

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
