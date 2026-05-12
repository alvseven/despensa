import { schedules } from '@trigger.dev/sdk/v3';

import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { sendAccountDigestTask } from './send-account-digest.ts';

export const processPendingNotificationsTask = schedules.task({
  id: 'process-pending-notifications',
  cron: '0 9 * * *',
  run: async (_payload, { ctx }) => {
    const { getPendingForToday, markManyAsScheduled } = notificationsRepository();

    const pending = await getPendingForToday();
    if (pending.length === 0) {
      return { runId: ctx.run.id, processed: 0, accounts: 0 };
    }

    const byAccount = new Map<string, string[]>();
    for (const notification of pending) {
      const existing = byAccount.get(notification.accountId) ?? [];
      existing.push(notification.id);
      byAccount.set(notification.accountId, existing);
    }

    for (const [accountId, notificationIds] of byAccount) {
      await sendAccountDigestTask.trigger({ accountId, notificationIds });
      await markManyAsScheduled(notificationIds);
    }

    return { runId: ctx.run.id, processed: pending.length, accounts: byAccount.size };
  }
});
