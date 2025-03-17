import { Hono } from "hono";

import {
  createProductRequestSchema,
  deleteProductByIdRequestSchema,
  getProductByIdRequestSchema,
  updateProductByIdRequestSchema,
} from "./schemas.ts";

import { productsService } from "./services.ts";
import { productsRepository } from "./repository.ts";
import { validateSchema } from "../../shared/helpers/validate-schema.ts";
import { verifyJwt } from "../../shared/middlewares/verify-jwt.ts";

export const productsRoutes = new Hono();

const { createProduct, getProductById, updateProductById, deleteProductById } =
  productsService(productsRepository());

productsRoutes.post("", verifyJwt, async (c) => {
  const userId = c.get("jwtPayload").sub.id;
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    createProductRequestSchema,
    { ...body, userId }
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_error, response] = await createProduct(parsedSchema.data);

  return c.json(response.data, response.code);
});

productsRoutes.get("/:id", verifyJwt, async (c) => {
  const userId = c.get("jwtPayload").sub.id;
  const id = c.req.param("id");

  const [schemaError, parsedSchema] = validateSchema(
    getProductByIdRequestSchema,
    {
      userId,
      id,
    }
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await getProductById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

productsRoutes.patch("/:id", verifyJwt, async (c) => {
  const userId = c.get("jwtPayload").sub.id;
  const id = c.req.param("id");
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    updateProductByIdRequestSchema,
    { ...body, id, userId }
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

productsRoutes.delete("/:id", verifyJwt, async (c) => {
  const userId = c.get("jwtPayload").sub.id;
  const id = c.req.param("id");

  const [schemaError, parsedSchema] = validateSchema(
    deleteProductByIdRequestSchema,
    {
      id,
      userId,
    }
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error] = await deleteProductById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.status(204);
});
