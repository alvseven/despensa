import { verifyToken } from '@clerk/backend';
import { createMiddleware } from 'hono/factory';

import { envs } from '@/shared/config/env.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { logger } from '@/shared/infra/observability/logger.ts';

/**
 * Attached to the Hono context by `requireAuth` after a Clerk session token
 * is verified and the caller's default account is resolved.
 */
export type AuthContext = {
  clerkId: string;
  userId: string;
  accountId: string;
  email: string;
};

export type AppVariables = {
  auth: AuthContext;
  requestId: string;
};

export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Token is missing' }, STATUS_CODES.UNAUTHORIZED);
  }

  const token = authHeader.slice('Bearer '.length);

  let clerkId: string;
  try {
    const payload = await verifyToken(token, { secretKey: envs.CLERK_SECRET_KEY });
    clerkId = payload.sub;
  } catch (err) {
    logger.warn({ err, requestId: c.get('requestId') }, 'clerk token verification failed');
    return c.json({ message: 'Invalid token' }, STATUS_CODES.UNAUTHORIZED);
  }

  const authContext = await usersRepository().getAuthContextByClerkId(clerkId);

  if (!authContext) {
    return c.json({ message: 'User not provisioned or has no account' }, STATUS_CODES.UNAUTHORIZED);
  }

  c.set('auth', {
    clerkId,
    userId: authContext.userId,
    accountId: authContext.accountId,
    email: authContext.email
  });

  await next();
});
