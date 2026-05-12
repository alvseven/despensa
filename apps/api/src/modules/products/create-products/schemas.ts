import { z } from 'zod';

import { futureDateField, pastDateField } from '@/shared/helpers/date-fields.ts';

export const createProductRequestSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1),
  buyedAt: pastDateField,
  notifications: z.array(futureDateField).min(1).max(3),
  category: z.string(),
  expiresAt: futureDateField
});

export type CreateProductInput = z.infer<typeof createProductRequestSchema>;
