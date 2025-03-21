import { Hono } from "hono";

import {
  createUserRequestSchema,
  getUserByIdRequestSchema,
  updateUserByIdRequestSchema,
  authenticateUserRequestSchema,
} from "./schemas.ts";

import { usersService } from "./services.ts";
import { usersRepository } from "./repository.ts";
import { validateSchema } from "../../shared/helpers/validate-schema.ts";
import { validateUserOwnership } from "../../shared/middlewares/validate-user-ownership.ts";
import { verifyJwt } from "../../shared/middlewares/verify-jwt.ts";

export const usersRoutes = new Hono();

const {
  createUser,
  getUserById,
  updateUserById,
  deleteUserById,
  authenticateUser,
} = usersService(usersRepository());

usersRoutes.post("", async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    createUserRequestSchema,
    body,
    ["password"]
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await createUser(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});

usersRoutes.get("/:id", verifyJwt, validateUserOwnership, async (c) => {
  const [schemaError, parsedSchema] = validateSchema(getUserByIdRequestSchema, {
    id: c.req.param("id"),
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

usersRoutes.patch("/:id", verifyJwt, validateUserOwnership, async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    updateUserByIdRequestSchema,
    { ...body, id: c.req.param("id") },
    ["password"]
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

usersRoutes.delete("/:id", verifyJwt, validateUserOwnership, async (c) => {
  const [schemaError, parsedSchema] = validateSchema(getUserByIdRequestSchema, {
    id: c.req.param("id"),
  });

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error] = await deleteUserById(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.status(204);
});

usersRoutes.post("/login", async (c) => {
  const body = await c.req.json();

  const [schemaError, parsedSchema] = validateSchema(
    authenticateUserRequestSchema,
    body,
    ["password"]
  );

  if (schemaError) {
    return c.json({ message: schemaError.message }, schemaError.code);
  }

  const [error, response] = await authenticateUser(parsedSchema.data);

  if (error) {
    return c.json({ message: error.message }, error.code);
  }

  return c.json(response.data, response.code);
});
