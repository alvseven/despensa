import 'server-only';

import { auth } from '@clerk/nextjs/server';

import { envs } from './env';

/**
 * Mirrors the API's error shape (`apps/api/src/shared/infra/http/error-handler.ts`):
 * every non-2xx carries a `message` and the `requestId` that correlates with the
 * backend logs. `fieldErrors` is only present on Zod validation failures (400).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly requestId?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    options: { requestId?: string; fieldErrors?: Record<string, string[]> } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = options.requestId;
    this.fieldErrors = options.fieldErrors;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * Server-side fetch against the Despensa API, authenticated with the caller's
 * Clerk session token. This only works from server components, server actions,
 * and route handlers — `auth()` needs the request context.
 *
 * The API resolves the account from the verified token, so callers never send
 * an `accountId`.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    throw new ApiError(401, 'Not signed in');
  }

  const { body, headers, ...rest } = options;

  const response = await fetch(`${envs.API_URL}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store'
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error =
      payload && typeof payload === 'object'
        ? (payload as {
            message?: string;
            requestId?: string;
            fieldErrors?: Record<string, string[]>;
          })
        : {};

    throw new ApiError(response.status, error.message ?? 'Request failed', {
      requestId: error.requestId,
      fieldErrors: error.fieldErrors
    });
  }

  return payload as T;
}
