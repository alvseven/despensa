import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { envs } from './config/env.ts';
import { customLogger } from './config/logger.ts';

import { authRoutes } from '../modules/auth/routes.ts';
import { productsRoutes } from '../modules/products/routes.ts';
import { usersRoutes } from '../modules/users/routes.ts';

type Variables = JwtVariables;

export const app = new Hono<{ Variables: Variables }>();

app.use(
  prettyJSON({
    space: 4
  })
);

app.use(logger(customLogger));

app.route('/auth', authRoutes);
app.route('/users', usersRoutes);
app.route('/products', productsRoutes);

serve(
  {
    fetch: app.fetch,
    port: envs.API_PORT
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
