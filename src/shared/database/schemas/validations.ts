import type { InferSelectModel } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const validationTypesEnum = pgEnum('validation_types', ['phone', 'email']);

export const validations = pgTable('validations', {
  code: text('code').notNull().primaryKey(),
  type: validationTypesEnum('type').notNull(),
  identifier: text('identifier').notNull().unique(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export type Validation = InferSelectModel<typeof validations>;
