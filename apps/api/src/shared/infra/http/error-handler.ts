import type { Context } from 'hono';
import { ZodError } from 'zod';

import { logger } from '@/shared/infra/observability/logger.ts';
import { Sentry } from '@/shared/infra/observability/sentry.ts';

import { AppError } from './app-error.ts';
import { STATUS_CODES } from './status-code.ts';

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_NOT_NULL_VIOLATION = '23502';

// biome-ignore lint/suspicious/noExplicitAny: hono ErrorHandler context shape varies per-app; we only read `requestId` defensively.
export function globalErrorHandler(err: Error, c: Context<any>) {
  const requestId = c.get('requestId') as string | undefined;
  const base = { requestId, path: c.req.path, method: c.req.method };

  if (err instanceof AppError) {
    logger.warn({ ...base, err: err.message }, 'app error');
    return c.json({ message: err.message, requestId }, err.code);
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    logger.warn({ ...base, fieldErrors }, 'validation error');
    return c.json(
      { message: 'Validation failed', fieldErrors, requestId },
      STATUS_CODES.BAD_REQUEST
    );
  }

  const pgCode = extractPgCode(err);
  if (pgCode === PG_UNIQUE_VIOLATION) {
    logger.warn({ ...base, pgCode }, 'unique violation');
    return c.json({ message: 'Resource already exists', requestId }, STATUS_CODES.CONFLICT);
  }
  if (pgCode === PG_FOREIGN_KEY_VIOLATION) {
    logger.warn({ ...base, pgCode }, 'foreign key violation');
    return c.json(
      { message: 'Referenced resource not found', requestId },
      STATUS_CODES.BAD_REQUEST
    );
  }
  if (pgCode === PG_NOT_NULL_VIOLATION) {
    logger.warn({ ...base, pgCode }, 'not null violation');
    return c.json({ message: 'Missing required field', requestId }, STATUS_CODES.BAD_REQUEST);
  }

  logger.error({ ...base, err }, 'unhandled error');
  Sentry.captureException(err, { tags: { requestId, path: c.req.path } });

  return c.json(
    { message: 'Internal server error', requestId },
    STATUS_CODES.INTERNAL_SERVER_ERROR
  );
}

function extractPgCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
    return err.code;
  }
  if (err && typeof err === 'object' && 'cause' in err) {
    return extractPgCode((err as { cause: unknown }).cause);
  }
  return undefined;
}
