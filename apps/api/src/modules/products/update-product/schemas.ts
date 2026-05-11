import { SAO_PAULO_TIME_ZONE } from '@/shared/constants/time-zone.ts';
import { TZDate } from '@date-fns/tz';
import { isAfter, isBefore, isMatch } from 'date-fns';
import { z } from 'zod';

const dateFormat = 'yyyy-MM-dd';

const buyedAtSchema = z
  .string()
  .superRefine((date, ctx) => {
    if (!isMatch(date, dateFormat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
      return;
    }
    const today = new TZDate(new Date(), SAO_PAULO_TIME_ZONE);
    if (isAfter(new Date(date), today)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date must be before current date.'
      });
    }
  })
  .optional();

const expiresAtSchema = z
  .string()
  .superRefine((date, ctx) => {
    if (!isMatch(date, dateFormat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
      return;
    }
    const today = new TZDate(new Date(), SAO_PAULO_TIME_ZONE);
    if (isBefore(new Date(date), today)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date must be after current date.'
      });
    }
  })
  .optional();

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  name: z.string().min(1).optional(),
  buyedAt: buyedAtSchema,
  category: z.string().optional(),
  expiresAt: expiresAtSchema
});

export type UpdateProductByIdInput = z.infer<typeof updateProductByIdRequestSchema>;
