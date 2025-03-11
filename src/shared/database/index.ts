import { drizzle } from "drizzle-orm/node-postgres";
import { envs } from "../config/env.ts";

import * as schema from "./schemas/index.ts";

export const db = drizzle(envs.DATABASE_URL, {
  schema,
  logger: envs.NODE_ENV === "development",
});
