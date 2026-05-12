// IMPORTANT: import sentry first so init runs before anything else.
import './infra/observability/sentry.ts';

import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';

import { envs } from './config/env.ts';
import { db } from './database/index.ts';
import { globalErrorHandler } from './infra/http/error-handler.ts';
import { requestId } from './infra/http/middlewares/request-id.ts';
import { logger } from './infra/observability/logger.ts';

import type { AppVariables } from '../modules/auth/middlewares/require-auth.ts';
import { productsRoutes } from '../modules/products/routes.ts';
import { usersRoutes } from '../modules/users/routes.ts';
import { clerkWebhooksRoutes } from '../modules/webhooks/clerk/routes.ts';

export const app = new Hono<{ Variables: AppVariables }>();

app.use(
  cors({
    origin: envs.CORS_ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'x-request-id'],
    exposeHeaders: ['x-request-id'],
    credentials: true,
    maxAge: 600
  })
);
app.use(prettyJSON({ space: 4 }));
app.use(requestId);
app.use(async (c, next) => {
  const start = Date.now();
  await next();
  logger.info(
    {
      requestId: c.get('requestId'),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - start
    },
    'request'
  );
});

// Liveness, process is up. Use this for restart logic.
app.get('/health', (c) => c.json({ status: 'ok' }));

// Readiness, process can serve traffic (DB reachable), Use this for LB.
app.get('/ready', async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ status: 'ok' });
  } catch (err) {
    logger.warn({ err }, 'readiness check failed');
    return c.json({ status: 'unavailable' }, 503);
  }
});

const v1 = new Hono<{ Variables: AppVariables }>();
v1.route('/users', usersRoutes);
v1.route('/products', productsRoutes);

app.route('/v1', v1);
app.route('/webhooks/clerk', clerkWebhooksRoutes);

app.onError(globalErrorHandler);

logger.info({ port: envs.API_PORT }, 'server starting');

export default {
  port: envs.API_PORT,
  fetch: app.fetch
};
