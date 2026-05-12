import { z } from 'zod';

import { futureDateField, pastDateField } from '@/shared/helpers/date-fields.ts';

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  name: z.string().min(1).optional(),
  buyedAt: pastDateField.optional(),
  category: z.string().optional(),
  expiresAt: futureDateField.optional()
});

export type UpdateProductByIdInput = z.infer<typeof updateProductByIdRequestSchema>;
