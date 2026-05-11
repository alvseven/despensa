import { type InferSelectModel, relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { randomUUID } from 'node:crypto';

import { accounts } from './accounts.ts';
import { users } from './users.ts';

export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'admin', 'member']);

export const memberships = pgTable(
  'memberships',
  {
    id: text('id').$defaultFn(randomUUID).primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('member'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
  },
  (table) => [unique('memberships_account_user_unique').on(table.accountId, table.userId)]
);

export type Membership = InferSelectModel<typeof memberships>;

export const membershipsRelations = relations(memberships, ({ one }) => ({
  account: one(accounts, {
    fields: [memberships.accountId],
    references: [accounts.id]
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id]
  })
}));
