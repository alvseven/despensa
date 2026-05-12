import { z } from 'zod';

const envsSchema = z.object({
  API_PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SENTRY_DSN: z.string().optional(),

  DATABASE_URL: z.string(),
  DRIZZLE_KIT_DATABASE_URL: z.string(),

  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),

  RESEND_API_KEY: z.string()
});

export const envs = Object.freeze(envsSchema.parse(process.env));
