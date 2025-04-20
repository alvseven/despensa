import { PublishCommand } from '@aws-sdk/client-sns';

import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import type { Notification } from '@/shared/database/schemas/notifications.ts';
import { snsClient } from '@/shared/infra/aws/sns-client.ts';

export type SendNotificationInput = {
  phoneNumber: string;
  message: string;
  notificationId: Notification['id'];
};

export async function sendSMSNotification({
  phoneNumber,
  message,
  notificationId
}: SendNotificationInput) {
  const { markNotificationAsSent, markNotificationAsFailed } = notificationsRepository();

  try {
    const result = await snsClient.send(
      new PublishCommand({
        Message: message,
        PhoneNumber: phoneNumber
      })
    );

    await markNotificationAsSent(notificationId);

    console.log(
      `SMS sent successfully for notification ${notificationId}, Message ID: ${result.MessageId}`
    );
  } catch (error) {
    console.error(`Failed to send SMS for notification ${notificationId}:`, error);

    await markNotificationAsFailed(notificationId);
  }

  // TODO - Add logging
}
