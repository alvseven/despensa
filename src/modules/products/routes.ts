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

import { verifyJwt } from '../auth/middlewares/verify-token.ts';

import { validateSchema } from '../../shared/helpers/validate-schema.ts';

export const productsRoutes = new Hono();

productsRoutes.post('', verifyJwt, async (c) => {
  const userId = c.get('jwtPayload').sub.id;
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(createProductRequestSchema, {
    ...body,
    userId
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_error, response] = await createProduct(parsedSchema.data);

  return c.json(response.data, response.code);
});

productsRoutes.get('/', verifyJwt, async (c) => {
  const userId = c.get('jwtPayload').sub.id;

  const [schemaError, parsedSchema] = validateSchema(getProductsRequestSchema, {
    userId
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_, response] = await getProducts(parsedSchema.data);

  return c.json(response.data, response.code);
});

productsRoutes.get('/:id', verifyJwt, async (c) => {
  const userId = c.get('jwtPayload').sub.id;
  const id = c.req.param('id');

  const [schemaError, parsedSchema] = validateSchema(getProductByIdRequestSchema, {
    userId,
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

productsRoutes.patch('/:id', verifyJwt, async (c) => {
  const userId = c.get('jwtPayload').sub.id;
  const id = c.req.param('id');
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(updateProductByIdRequestSchema, {
    ...body,
    id,
    userId
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await updateProductById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

productsRoutes.delete('/:id', verifyJwt, async (c) => {
  const userId = c.get('jwtPayload').sub.id;
  const id = c.req.param('id');

  const [schemaError, parsedSchema] = validateSchema(deleteProductRequestSchema, {
    id,
    userId
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error] = await deleteProduct(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.status(204);
});
