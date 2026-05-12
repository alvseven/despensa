import { Hono } from 'hono';

import { type AppVariables, requireAuth } from '../auth/middlewares/require-auth.ts';
import { getMe } from './get-me/use-case.ts';

import { respond } from '@/shared/infra/http/api-response.ts';

export const usersRoutes = new Hono<{ Variables: AppVariables }>();

usersRoutes.get('/me', requireAuth, async (c) => {
  const { userId } = c.get('auth');

  return respond(c, await getMe({ userId }));
});
