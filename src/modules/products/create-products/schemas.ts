import { TZDate } from '@date-fns/tz';
import { format, isAfter, isBefore, isMatch, parse } from 'date-fns';
import { isValid, z } from 'zod';

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

    const currentDate = new TZDate(new Date(), 'America/Sao_Paulo');
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

    const currentDate = new TZDate(new Date(), 'America/Sao_Paulo');
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
