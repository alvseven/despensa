import { TZDate } from '@date-fns/tz';
import { schedules } from '@trigger.dev/sdk/v3';
import { format } from 'date-fns';

import { SAO_PAULO_TIME_ZONE } from '@/shared/constants/time-zone.ts';
import { db } from '@/shared/database/index.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { sendAccountDigestTask } from './send-account-digest.ts';

export const processPendingNotificationsTask = schedules.task({
  id: 'process-pending-notifications',
  cron: '0 9 * * *',
  run: async (_payload, { ctx }) => {
    const today = format(new TZDate(new Date(), SAO_PAULO_TIME_ZONE), 'yyyy-MM-dd');

    // Atomically claim today's pending notifications: mark scheduled inside a
    // transaction, return the groups, then trigger downstream. If a marker
    // write failed *after* a trigger fired (the previous order), the next
    // cron tick would re-pick the same rows and send a duplicate email.
    const byAccount = await db.transaction(async (tx) => {
      const { getPendingFor, markManyAsScheduled } = notificationsRepository(tx);
      const pending = await getPendingFor(today);
      if (pending.length === 0) return new Map<string, string[]>();

      const grouped = new Map<string, string[]>();
      for (const notification of pending) {
        const existing = grouped.get(notification.accountId) ?? [];
        existing.push(notification.id);
        grouped.set(notification.accountId, existing);
      }

      await markManyAsScheduled(pending.map((n) => n.id));
      return grouped;
    });

    if (byAccount.size === 0) {
      return { runId: ctx.run.id, processed: 0, accounts: 0 };
    }

    let processed = 0;
    for (const [accountId, notificationIds] of byAccount) {
      await sendAccountDigestTask.trigger({ accountId, notificationIds });
      processed += notificationIds.length;
    }

    return { runId: ctx.run.id, processed, accounts: byAccount.size };
  }
});
