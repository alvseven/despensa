import { z } from 'zod';

export const sendExpirationDigestRequestSchema = z.object({
  accountId: z.string().uuid(),
  notificationIds: z.array(z.string().uuid()).min(1).max(50)
});

export type SendExpirationDigestInput = z.infer<typeof sendExpirationDigestRequestSchema>;
