import { Hono } from 'hono';

import { createProductRequestSchema } from './create-products/schemas.ts';
import { createProduct } from './create-products/use-case.ts';
import { deleteProductRequestSchema } from './delete-products/schemas.ts';
import { deleteProduct } from './delete-products/use-case.ts';
import { getProductByIdRequestSchema } from './get-product/schemas.ts';
import { getProduct } from './get-product/use-case.ts';
import { getProductsRequestSchema } from './get-products/schemas.ts';
import { getProducts } from './get-products/use-case.ts';
import { updateProductByIdRequestSchema } from './update-product/schemas.ts';
import { updateProductById } from './update-product/use-case.ts';

import { type AppVariables, requireAuth } from '../auth/middlewares/require-auth.ts';

import { validateSchema } from '@/shared/helpers/validate-schema.ts';

export const productsRoutes = new Hono<{ Variables: AppVariables }>();

productsRoutes.use(requireAuth);

productsRoutes.post('', async (c) => {
  const { accountId } = c.get('auth');
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    createProductRequestSchema,
    { ...body, accountId },
    ['buyedAt', 'expiresAt']
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_error, response] = await createProduct(parsedSchema.data);

  return c.json(response.data, response.code);
});

productsRoutes.get('/', async (c) => {
  const { accountId } = c.get('auth');

  const [schemaError, parsedSchema] = validateSchema(getProductsRequestSchema, { accountId });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_, response] = await getProducts(parsedSchema.data);

  return c.json(response.data, response.code);
});

productsRoutes.get('/:id', async (c) => {
  const { accountId } = c.get('auth');
  const id = c.req.param('id');

  const [schemaError, parsedSchema] = validateSchema(getProductByIdRequestSchema, {
    accountId,
    id
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await getProduct(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

productsRoutes.patch('/:id', async (c) => {
  const { accountId } = c.get('auth');
  const id = c.req.param('id');
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    updateProductByIdRequestSchema,
    { ...body, id, accountId },
    ['buyedAt', 'expiresAt']
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await updateProductById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

productsRoutes.delete('/:id', async (c) => {
  const { accountId } = c.get('auth');
  const id = c.req.param('id');

  const [schemaError, parsedSchema] = validateSchema(deleteProductRequestSchema, {
    id,
    accountId
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  await deleteProduct(parsedSchema.data);
  return c.body(null, 204);
});
