import { format } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type Notification, notifications } from '../schemas/notifications.ts';

type Tx = NodePgDatabase<typeof schema>;

export const notificationsRepository = (tx: Tx = db) => {
  const createNotification = async (
    notification: Pick<Notification, 'notifyAt' | 'productId' | 'accountId'>
  ) => {
    const [notificationCreated] = await tx.insert(notifications).values(notification).returning();

    return notificationCreated;
  };

  const getNotificationById = async (id: Notification['id']) => {
    const [notification] = await tx.select().from(notifications).where(eq(notifications.id, id));

    return notification;
  };

  const updateNotificationById = async (
    id: Notification['id'],
    notification: Pick<Notification, 'notifyAt'> | Pick<Notification, 'status'>
  ) => {
    const [updatedNotification] = await tx
      .update(notifications)
      .set({
        ...notification
      })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  };

  const getPendingNotifications = async () => {
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');

    return await tx
      .select()
      .from(notifications)
      .where(and(eq(notifications.status, 'created'), eq(notifications.notifyAt, formattedDate)));
  };

  const scheduleNotification = async (id: Notification['id']) => {
    const [updatedNotification] = await tx
      .update(notifications)
      .set({
        status: 'scheduled'
      })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification;
  };

  const markNotificationAsSent = async (id: Notification['id']) => {
    return await tx
      .update(notifications)
      .set({
        status: 'sent'
      })
      .where(eq(notifications.id, id));
  };

  const markNotificationAsFailed = async (id: Notification['id']) => {
    return await tx
      .update(notifications)
      .set({
        status: 'failed'
      })
      .where(eq(notifications.id, id));
  };

  return {
    createNotification,
    getNotificationById,
    updateNotificationById,
    getPendingNotifications,
    scheduleNotification,
    markNotificationAsSent,
    markNotificationAsFailed
  };
};
