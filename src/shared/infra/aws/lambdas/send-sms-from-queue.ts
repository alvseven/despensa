import type { SQSEvent } from 'aws-lambda';

import { sendSMSNotification } from '@/modules/notifications/send-sms-notification/use-case.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { productsRepository } from '@/shared/database/repositories/products.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { differenceInCalendarDays } from 'date-fns';
import { z } from 'zod';

export const handler = async (event: SQSEvent) => {
  const { getNotificationById } = notificationsRepository();
  const { getUserById } = usersRepository();
  const { getProductByIdAndUserId } = productsRepository();

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);

      const eventSchema = z.object({
        notificationId: z.string()
      });

      const { notificationId } = eventSchema.parse(body);

      const notification = await getNotificationById(notificationId);

      if (!notification) {
        console.error(`Notification not found: ${notificationId}`);
        continue;
      }

      const user = await getUserById(notification.userId);
      const product = await getProductByIdAndUserId({
        id: notification.productId,
        userId: notification.userId
      });

      if (!user || !product) {
        console.error(`Missing user or product for notification ${notificationId}`);
        continue;
      }

      if (!user.phoneNumber) {
        console.error(`User ${user.id} has no phone number`);
        continue;
      }

      const daysToExpire = differenceInCalendarDays(new Date(product.expiresAt), new Date());

      const message = `Despensa: Olá, ${user.name}, seu produto ${product.name} irá vencer em ${daysToExpire} dias!`;

      await sendSMSNotification({
        phoneNumber: user.phoneNumber,
        message,
        notificationId: notification.id
      });
    } catch (err) {
      console.error('Failed to process SQS message:', err);
    }
  }
};
