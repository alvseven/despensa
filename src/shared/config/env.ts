import 'dotenv/config';

import { z } from 'zod';

const envsSchema = z.object({
  API_PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production']),
  JWT_SECRET: z.string(),
  JWT_EXPIRATION: z.coerce.number(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  DATABASE_URL: z.string(),
  DRIZZLE_KIT_DATABASE_URL: z.string(),
  PASSWORD_SALT_ROUNDS: z.coerce.number(),
  AWS_SQS_QUEUE_URL: z.string().url(),
  AWS_SQS_REGION: z.string(),
  AWS_SQS_ACCESS_KEY_ID: z.string(),
  AWS_SQS_SECRET_ACCESS_KEY: z.string(),
  AWS_SNS_ACCESS_KEY_ID: z.string(),
  AWS_SNS_SECRET_ACCESS_KEY: z.string(),
  AWS_SNS_REGION: z.string(),
  RESEND_API_KEY: z.string(),
  SMS_VERIFICATION_CODE_EXPIRES_IN: z.coerce.number(),
  EMAIL_VERIFICATION_CODE_EXPIRES_IN: z.coerce.number()
});

export const envs = Object.freeze(envsSchema.parse(process.env));
