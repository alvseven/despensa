import { z } from 'zod';

const envsSchema = z.object({
  API_PORT: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SENTRY_DSN: z.string().optional(),

  DATABASE_URL: z.string().min(1),
  DRIZZLE_KIT_DATABASE_URL: z.string().min(1),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),

  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001')
    .transform((s) =>
      s
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
});

export const envs = Object.freeze(envsSchema.parse(process.env));
