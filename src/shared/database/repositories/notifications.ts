import { eq } from 'drizzle-orm';
import { db } from '../index.ts';
import { type Notification, notifications } from '../schemas/notifications.ts';

export const notificationsRepository = () => {
  const createNotification = async (
    notification: Pick<Notification, 'notifyAt' | 'productId' | 'userId'>
  ) => {
    const [notificationCreated] = await db.insert(notifications).values(notification).returning();

    return notificationCreated;
  };

  const getNotificationById = async (id: Notification['id']) => {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));

    return notification;
  };

  const updateNotificationById = async (
    id: Notification['id'],
    notification: Pick<Notification, 'notifyAt'> | Pick<Notification, 'status'>
  ) => {
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        ...notification
      })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  };

  const getPendingNotifications = async () => {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.status, 'created'))
      .execute();

      // TODO status === created AND notifyAt === today
  };

  const scheduleNotification = async (id: Notification['id']) => {
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        status: 'scheduled'
      })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification;
  };

  const markNotificationAsSent = async (id: Notification['id']) => {
    return await db
      .update(notifications)
      .set({
        status: 'sent'
      })
      .where(eq(notifications.id, id));
  };

  const markNotificationAsFailed = async (id: Notification['id']) => {
    return await db
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
