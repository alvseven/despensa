import { TZDate } from '@date-fns/tz';
import { isAfter, isBefore, isMatch } from 'date-fns';
import { z } from 'zod';

const dateFormat = 'yyyy-MM-dd';

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).optional(),
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

export type UpdateProductByIdInput = z.infer<typeof updateProductByIdRequestSchema>;
