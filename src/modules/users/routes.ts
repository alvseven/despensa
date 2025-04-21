import { Hono } from 'hono';

import { createUserRequestSchema } from './create-user/schemas.ts';
import { createUser } from './create-user/use-case.ts';
import { getUserByIdRequestSchema } from './get-user/schemas.ts';
import { getUserById } from './get-user/use-case.ts';
import { softDeleteUserByIdRequestSchema } from './soft-delete-user/schemas.ts';
import { softDeleteUserById } from './soft-delete-user/use-case.ts';
import { updateUserByIdRequestSchema } from './update-user/schemas.ts';
import { updateUserById } from './update-user/use-case.ts';

import { verifyJwt } from '../auth/middlewares/verify-token.ts';

import { validateSchema } from '@/shared/helpers/validate-schema.ts';
import { validateUserOwnership } from '@/shared/infra/http/middlewares/validate-user-ownership.ts';
import { createUserWithGoogleRequestSchema } from './create-user-with-google/schemas.ts';
import { createUserWithGoogle } from './create-user-with-google/use-case.ts';

export const usersRoutes = new Hono();

usersRoutes.post('', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(createUserRequestSchema, body, ['password']);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await createUser(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

usersRoutes.post('/google', async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(createUserWithGoogleRequestSchema, body);

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await createUserWithGoogle(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

usersRoutes.get('/:id', verifyJwt, validateUserOwnership, async (c) => {
  const [schemaError, parsedSchema] = validateSchema(getUserByIdRequestSchema, {
    id: c.req.param('id')
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await getUserById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

usersRoutes.patch('/:id', verifyJwt, validateUserOwnership, async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    updateUserByIdRequestSchema,
    { ...body, id: c.req.param('id') },
    ['password']
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await updateUserById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

usersRoutes.delete('/:id', verifyJwt, validateUserOwnership, async (c) => {
  const [schemaError, parsedSchema] = validateSchema(softDeleteUserByIdRequestSchema, {
    id: c.req.param('id')
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await softDeleteUserById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.status(response.code);
});
