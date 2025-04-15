import type { InferSelectModel } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const validationTypesEnum = pgEnum('validation_types', ['phone', 'email']);

export const validation = pgTable('validation', {
  code: text('code').notNull().primaryKey(),
  type: validationTypesEnum('type').notNull(),
  identifier: text('identifier').notNull().unique(), // phone number or email
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export type Validation = InferSelectModel<typeof validation>;
