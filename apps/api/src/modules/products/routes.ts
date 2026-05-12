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
import { respond } from '@/shared/infra/http/api-response.ts';

export const productsRoutes = new Hono<{ Variables: AppVariables }>();

productsRoutes.use(requireAuth);

productsRoutes.post('', async (c) => {
  const { accountId } = c.get('auth');
  const body = await c.req.json();

  const data = validateSchema(createProductRequestSchema, { ...body, accountId }, [
    'buyedAt',
    'expiresAt'
  ]);

  return respond(c, await createProduct(data));
});

productsRoutes.get('/', async (c) => {
  const { accountId } = c.get('auth');

  const data = validateSchema(getProductsRequestSchema, { accountId });

  return respond(c, await getProducts(data));
});

productsRoutes.get('/:id', async (c) => {
  const { accountId } = c.get('auth');
  const id = c.req.param('id');

  const data = validateSchema(getProductByIdRequestSchema, { accountId, id });

  return respond(c, await getProduct(data));
});

productsRoutes.patch('/:id', async (c) => {
  const { accountId } = c.get('auth');
  const id = c.req.param('id');
  const body = await c.req.json();

  const data = validateSchema(updateProductByIdRequestSchema, { ...body, id, accountId }, [
    'buyedAt',
    'expiresAt'
  ]);

  return respond(c, await updateProductById(data));
});

productsRoutes.delete('/:id', async (c) => {
  const { accountId } = c.get('auth');
  const id = c.req.param('id');

  const data = validateSchema(deleteProductRequestSchema, { id, accountId });

  await deleteProduct(data);
  return c.body(null, 204);
});
