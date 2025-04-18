import { Hono } from 'hono';

import { authenticateUserRequestSchema } from './authenticate/schemas.ts';
import { authenticateUser } from './authenticate/use-case.ts';

import { validateSchema } from '@/shared/helpers/validate-schema.ts';
import { sendEmailVerificationCodeRequestSchema } from './verification/send-email-verification-code/schemas.ts';
import { sendEmailVerificationCode } from './verification/send-email-verification-code/use-case.ts';
import { sendPhoneVerificationCodeRequestSchema } from './verification/send-phone-verification-code/schemas.ts';
import { sendPhoneVerificationCode } from './verification/send-phone-verification-code/use-case.ts';
import { verifyEmailRequestSchema } from './verification/verify-email/schemas.ts';
import { verifyEmail } from './verification/verify-email/use-case.ts';
import { verifyPhoneNumberRequestSchema } from './verification/verify-phone-number/schemas.ts';
import { verifyPhoneNumber } from './verification/verify-phone-number/use-case.ts';
import { createUserWithGoogleRequestSchema } from '../users/create-user-with-google/schemas.ts';
import { createUserWithGoogle } from '../users/create-user-with-google/use-case.ts';
export const authRoutes = new Hono();

authRoutes.post('/login/password', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(authenticateUserRequestSchema, body, [
    'password'
  ]);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await authenticateUser(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

authRoutes.post('/login/google', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(createUserWithGoogleRequestSchema, body);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await createUserWithGoogle(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

authRoutes.post('/emails/verify', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(verifyEmailRequestSchema, body);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await verifyEmail(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.status(response.code);
});

authRoutes.post('/phone-numbers/verify', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(verifyPhoneNumberRequestSchema, body, [
    'phoneNumber'
  ]);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await verifyPhoneNumber(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.status(response.code);
});

authRoutes.post('/emails/verification-code/send', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(sendEmailVerificationCodeRequestSchema, body);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_, response] = await sendEmailVerificationCode(parsedSchema.data);

  return c.status(response.code);
});

authRoutes.post('/phone-numbers/verification-code/send', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(sendPhoneVerificationCodeRequestSchema, body, [
    'phoneNumber'
  ]);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_, response] = await sendPhoneVerificationCode(parsedSchema.data);

  return c.status(response.code);
});
