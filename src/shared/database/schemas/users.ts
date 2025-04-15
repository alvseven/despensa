import { type InferSelectModel, relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { randomUUID } from 'node:crypto';
import { products } from './products.ts';

export const users = pgTable('users', {
  id: text('id').$defaultFn(randomUUID).primaryKey(),
  isPhoneVerified: boolean('is_phone_verified').notNull().default(false),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phoneNumber: text('phone_number').notNull().unique(),
  password: text('password').notNull(),
  avatarUrl: text('avatar_url'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date'
  })
});

export type User = InferSelectModel<typeof users>;

export const usersRelations = relations(users, ({ many }) => ({
  products: many(products)
}));
