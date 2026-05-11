import { type InferSelectModel, relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { randomUUID } from 'node:crypto';

import { memberships } from './memberships.ts';
import { notifications } from './notifications.ts';
import { products } from './products.ts';

export const accountTypeEnum = pgEnum('account_type', ['personal', 'org']);

export const accounts = pgTable('accounts', {
  id: text('id').$defaultFn(randomUUID).primaryKey(),
  type: accountTypeEnum('type').notNull(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' })
});

export type Account = InferSelectModel<typeof accounts>;

export const accountsRelations = relations(accounts, ({ many }) => ({
  memberships: many(memberships),
  products: many(products),
  notifications: many(notifications)
}));
