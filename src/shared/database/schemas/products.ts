import { relations } from "drizzle-orm";
import { date, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { randomUUID } from "crypto";

export const products = pgTable("products", {
  id: text("id").$defaultFn(randomUUID).primaryKey(),
  name: text("name").notNull(),
  buyedAt: date("buyed_at", { mode: "string" }).notNull(),
  expirestAt: date("expires_at", { mode: "string" }).notNull(),
  category: text("category"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// export const usersRelations = relations(users, ({ one }) => ({
// TODO
// }))
