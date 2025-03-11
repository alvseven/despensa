import { jwt } from "hono/jwt";
import { app } from "../../../shared/app.ts";
import { envs } from "../../../shared/config/env.ts";

const jwtMiddleware = () => {
  app.use();
};

app.use(
  "/auth/*",
  jwt({
    secret: envs.JWT_SECRET,
  })
);
