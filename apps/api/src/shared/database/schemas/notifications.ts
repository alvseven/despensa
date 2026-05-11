import { type InferSelectModel, relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { randomUUID } from 'node:crypto';

import { accounts } from './accounts.ts';
import { products } from './products.ts';

export const notificationStatusEnum = pgEnum('notification_status', [
  'created',
  'scheduled',
  'sent',
  'failed'
]);

export const notifications = pgTable('notifications', {
  id: text('id').$defaultFn(randomUUID).primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  notifyAt: timestamp('notify_at', { withTimezone: true, mode: 'string' }).notNull(),
  status: notificationStatusEnum('status').notNull().default('created'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export type Notification = InferSelectModel<typeof notifications>;

export const notificationsRelations = relations(notifications, ({ one }) => ({
  product: one(products, {
    fields: [notifications.productId],
    references: [products.id]
  }),
  account: one(accounts, {
    fields: [notifications.accountId],
    references: [accounts.id]
  })
}));
