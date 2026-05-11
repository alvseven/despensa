import { verifyToken } from '@clerk/backend';
import { createMiddleware } from 'hono/factory';

import { envs } from '@/shared/config/env.ts';
import { membershipsRepository } from '@/shared/database/repositories/memberships.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import type { AppVariables } from '../jwt-payload.ts';

export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ message: 'Token is missing' }, STATUS_CODES.UNAUTHORIZED);
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = await verifyToken(token, { secretKey: envs.CLERK_SECRET_KEY });

    const clerkId = payload.sub;

    const user = await usersRepository().getUserByClerkId(clerkId);

    if (!user || user.deletedAt) {
      return c.json({ message: 'User not provisioned' }, STATUS_CODES.UNAUTHORIZED);
    }

    const memberships = await membershipsRepository().getMembershipsByUserId(user.id);
    const defaultMembership = memberships[0];

    if (!defaultMembership) {
      return c.json({ message: 'No account for user' }, STATUS_CODES.FORBIDDEN);
    }

    c.set('auth', {
      clerkId,
      userId: user.id,
      accountId: defaultMembership.accountId,
      email: user.email
    });

    await next();
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return c.json({ message: 'Invalid token' }, STATUS_CODES.UNAUTHORIZED);
  }
});
