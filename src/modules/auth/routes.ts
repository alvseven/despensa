import { Hono } from 'hono';

import { authenticateUserRequestSchema } from './authenticate/schemas.ts';
import { authenticateUser } from './authenticate/use-case.ts';

import { validateSchema } from '@/shared/helpers/validate-schema.ts';

export const authRoutes = new Hono();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(authenticateUserRequestSchema, body, [
    'password'
  ]);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await authenticateUser(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});
