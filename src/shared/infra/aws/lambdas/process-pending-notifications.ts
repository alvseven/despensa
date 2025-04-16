import { envs } from '@/shared/config/env.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { sqsClient } from '@/shared/infra/aws/sqs-client.ts';
import { SendMessageCommand } from '@aws-sdk/client-sqs';

async function processPendingNotifications() {
  const { getPendingNotifications, scheduleNotification } = notificationsRepository();

  const notifications = await getPendingNotifications();

  for (const notification of notifications) {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: envs.AWS_SQS_QUEUE_URL,
        MessageBody: JSON.stringify({
          notificationId: notification.id,
          userId: notification.userId,
          productId: notification.productId
        })
      })
    );

    await scheduleNotification(notification.id);
  }
}

export const handler = async () => {
  try {
    await processPendingNotifications();
    console.log('Processed pending notifications');
  } catch (error) {
    console.error('Error processing pending notifications:', error);
  }
};
