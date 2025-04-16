import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { randomUUID } from 'node:crypto';
import { type InferSelectModel, relations } from 'drizzle-orm';
import { products } from './products.ts';
import { users } from './users.ts';

export const notificationStatusEnum = pgEnum('notification_status', [
  'created',
  'scheduled',
  'sent',
  'failed'
]);

export const notifications = pgTable('notifications', {
  id: text('id').$defaultFn(randomUUID).primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  notifyAt: timestamp('notify_at', { withTimezone: true, mode: 'string' }).notNull(),
  status: notificationStatusEnum('status').notNull().default('created'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type Notification = InferSelectModel<typeof notifications>;

export const notificationRelations = relations(notifications, ({ one }) => ({
  product: one(products, {
    fields: [notifications.productId],
    references: [products.id]
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));
