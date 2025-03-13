import type { InferSelectModel } from "drizzle-orm";
import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { randomUUID } from "crypto";

export const products = pgTable("products", {
  id: text("id").$defaultFn(randomUUID).primaryKey(),
  name: text("name").notNull(),
  buyedAt: date("buyed_at", { mode: "string" }).notNull(),
  expiresAt: date("expires_at", { mode: "string" }).notNull(),
  category: text("category").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type Product = InferSelectModel<typeof products>;

// export const productsRelations = relations(users, ({ one }) => ({
// TODO
// }))
