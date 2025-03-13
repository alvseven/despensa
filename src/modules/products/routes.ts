import { Hono } from "hono";

import {
  createProductRequestSchema,
  getProductByIdRequestSchema,
  updateProductByIdRequestSchema,
} from "./schemas.ts";

import { productsService } from "./services.ts";
import { productsRepository } from "./repository.ts";
import { validateSchema } from "../../shared/helpers/validate-schema.ts";

export const productsRoutes = new Hono();

const { createProduct, getProductById, updateProductById, deleteProductById } =
  productsService(productsRepository());

productsRoutes.post("", async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    createProductRequestSchema,
    body
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [_error, response] = await createProduct(parsedSchema.data);

  return c.json(response.data, response.code);
});

productsRoutes.get("/:id", async (c) => {
  const [schemaError, parsedSchema] = validateSchema(
    getProductByIdRequestSchema,
    {
      id: c.req.param("id"),
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

productsRoutes.patch("/:id", async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    updateProductByIdRequestSchema,
    { ...body, id: c.req.param("id") }
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

productsRoutes.delete("/:id", async (c) => {
  const [schemaError, parsedSchema] = validateSchema(
    getProductByIdRequestSchema,
    {
      id: c.req.param("id"),
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
