import { and, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type Notification, notifications } from '../schemas/notifications.ts';
import { products } from '../schemas/products.ts';

type Tx = NodePgDatabase<typeof schema>;
type NotificationInsert = Pick<Notification, 'notifyAt' | 'productId' | 'accountId'>;

export const notificationsRepository = (tx: Tx = db) => {
  const createMany = async (rows: NotificationInsert[]) => {
    return await tx.insert(notifications).values(rows).returning();
  };

  const getPendingFor = async (date: string) => {
    return await tx
      .select()
      .from(notifications)
      .where(and(eq(notifications.status, 'created'), eq(notifications.notifyAt, date)));
  };

  const getWithProductsForAccount = async (
    ids: Notification['id'][],
    accountId: Notification['accountId']
  ) => {
    return await tx
      .select({ notification: notifications, product: products })
      .from(notifications)
      .innerJoin(products, eq(products.id, notifications.productId))
      .where(and(eq(notifications.accountId, accountId), inArray(notifications.id, ids)));
  };

  const markManyAs = async (status: Notification['status'], ids: Notification['id'][]) => {
    await tx.update(notifications).set({ status }).where(inArray(notifications.id, ids));
  };

  return {
    createMany,
    getPendingFor,
    getWithProductsForAccount,
    markManyAsScheduled: (ids: Notification['id'][]) => markManyAs('scheduled', ids),
    markManyAsSent: (ids: Notification['id'][]) => markManyAs('sent', ids),
    markManyAsFailed: (ids: Notification['id'][]) => markManyAs('failed', ids)
  };
};
