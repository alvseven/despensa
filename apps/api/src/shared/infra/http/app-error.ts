import type { ErrorStatusCode } from './status-code.ts';

/**
 * Throw from anywhere in a use case for an *expected* error condition
 * (validation, not-found, conflict, etc). The global Hono error handler
 * maps it to the right JSON response.
 *
 * For routine flow we still use the tuple convention; AppError is for
 * the cases where threading the error tuple through is awkward.
 */
export class AppError extends Error {
  readonly code: ErrorStatusCode;

  constructor(message: string, code: ErrorStatusCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}
