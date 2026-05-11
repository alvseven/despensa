import { Hono } from 'hono';

import type { AppVariables } from '../auth/jwt-payload.ts';
import { requireAuth } from '../auth/middlewares/require-auth.ts';
import { getMe } from './get-me/use-case.ts';

export const usersRoutes = new Hono<{ Variables: AppVariables }>();

usersRoutes.get('/me', requireAuth, async (c) => {
  const { userId } = c.get('auth');

  const [error, response] = await getMe({ userId });

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});
