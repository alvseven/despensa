import type { InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { randomUUID } from "crypto";

export const users = pgTable("users", {
  id: text("id").$defaultFn(randomUUID).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export type User = InferSelectModel<typeof users>;

// export const usersRelations = relations(users, ({ one }) => ({
// TODO
// }))
