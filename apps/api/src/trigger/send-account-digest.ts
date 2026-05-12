import { task } from '@trigger.dev/sdk/v3';

import { sendExpirationDigestRequestSchema } from '@/modules/notifications/send-expiration-digest/schemas.ts';
import { sendExpirationDigest } from '@/modules/notifications/send-expiration-digest/use-case.ts';

export const sendAccountDigestTask = task({
  id: 'send-account-digest',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 30_000,
    factor: 2
  },
  run: async (payload: unknown) => {
    const input = sendExpirationDigestRequestSchema.parse(payload);
    return await sendExpirationDigest(input);
  }
});
