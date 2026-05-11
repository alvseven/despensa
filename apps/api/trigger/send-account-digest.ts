import { task } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

import { sendExpirationDigest } from '@/modules/notifications/send-expiration-digest/use-case.ts';

const payloadSchema = z.object({
  accountId: z.string(),
  notificationIds: z.array(z.string()).min(1)
});

export const sendAccountDigestTask = task({
  id: 'send-account-digest',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 30_000,
    factor: 2
  },
  run: async (payload: unknown) => {
    const parsed = payloadSchema.parse(payload);
    return await sendExpirationDigest(parsed);
  }
});
