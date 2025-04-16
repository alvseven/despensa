import { type InferSelectModel, relations } from 'drizzle-orm';
import { date, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { randomUUID } from 'node:crypto';

import { users } from './users.ts';
import { notifications } from './notifications.ts';

export const products = pgTable('products', {
  id: text('id').$defaultFn(randomUUID).primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  buyedAt: date('buyed_at', { mode: 'string' }).notNull(),
  expiresAt: date('expires_at', { mode: 'string' }).notNull(),
  category: text('category').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export type Product = InferSelectModel<typeof products>;

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id]
  }),
  notifications: many(notifications),
}));
