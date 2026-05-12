// IMPORTANT: import sentry first so init runs before anything else.
import './infra/observability/sentry.ts';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';

import { envs } from './config/env.ts';
import { globalErrorHandler } from './infra/http/error-handler.ts';
import { requestId } from './infra/http/middlewares/request-id.ts';
import { logger } from './infra/observability/logger.ts';

import type { AppVariables } from '../modules/auth/middlewares/require-auth.ts';
import { productsRoutes } from '../modules/products/routes.ts';
import { usersRoutes } from '../modules/users/routes.ts';
import { clerkWebhooksRoutes } from '../modules/webhooks/clerk/routes.ts';

const allowedOrigins =
  envs.NODE_ENV === 'production'
    ? ['https://app.despensa.ai', 'https://despensa.ai']
    : ['http://localhost:3000', 'http://localhost:3001'];

export const app = new Hono<{ Variables: AppVariables }>();

app.use(
  cors({
    origin: allowedOrigins,
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

app.get('/health', (c) => c.json({ status: 'ok' }));

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
