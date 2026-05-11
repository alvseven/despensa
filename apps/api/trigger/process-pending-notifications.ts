import { schedules } from '@trigger.dev/sdk/v3';

import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { sendAccountDigestTask } from './send-account-digest.ts';

export const processPendingNotificationsTask = schedules.task({
  id: 'process-pending-notifications',
  cron: '0 9 * * *',
  run: async (_payload, { ctx }) => {
    const { getPendingNotifications, scheduleNotification } = notificationsRepository();

    const pending = await getPendingNotifications();

    const byAccount = new Map<string, typeof pending>();
    for (const notification of pending) {
      const existing = byAccount.get(notification.accountId) ?? [];
      existing.push(notification);
      byAccount.set(notification.accountId, existing);
    }

    for (const [accountId, notifications] of byAccount) {
      await sendAccountDigestTask.trigger({
        accountId,
        notificationIds: notifications.map((n) => n.id)
      });

      for (const notification of notifications) {
        await scheduleNotification(notification.id);
      }
    }

    return {
      runId: ctx.run.id,
      processed: pending.length,
      accounts: byAccount.size
    };
  }
});
