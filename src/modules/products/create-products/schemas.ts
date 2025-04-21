import { SAO_PAULO_TIME_ZONE } from '@/shared/constants/time-zone.ts';
import { TZDate } from '@date-fns/tz';
import {  isAfter, isBefore, isMatch } from 'date-fns';
import {  z } from 'zod';

const dateFormat = 'yyyy-MM-dd';

export const createProductRequestSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  buyedAt: z.string().superRefine((date, ctx) => {
    if (!isMatch(date, dateFormat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    const currentDate = new TZDate(new Date(), SAO_PAULO_TIME_ZONE);
    const parsedDate = new Date(date);

    const isAfterCurrentDate = isAfter(parsedDate, currentDate);

    if (isAfterCurrentDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date must be before current date.'
      });
    }
  }),
  notifications: z.array(z.string()).min(1).max(3),
  category: z.string(),
  expiresAt: z.string().superRefine((date, ctx) => {
    if (!isMatch(date, dateFormat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    const currentDate = new TZDate(new Date(), SAO_PAULO_TIME_ZONE);
    const parsedDate = new Date(date);

    if (isBefore(parsedDate, currentDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date must be after current date.'
      });
    }
  })
});

export type CreateProductInput = z.infer<typeof createProductRequestSchema>;
