import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { envs } from "../config/env.ts";

export const verifyJwt = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Token is missing" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, envs.JWT_SECRET);

    c.set("jwtPayload", payload);

    await next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return c.json({ message: "Invalid token" }, 401);
  }
});
