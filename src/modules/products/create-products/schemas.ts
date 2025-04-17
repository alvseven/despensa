import { TZDate } from '@date-fns/tz';
import { format, isAfter, isBefore, parse } from 'date-fns';
import { z } from 'zod';
export const createProductRequestSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  buyedAt: z.string().refine(
    (date) => {
      const currentDate = new TZDate(new Date(), 'America/Sao_Paulo');
      const parsedDate = new Date(date);

      const isAfterCurrentDate = isAfter(parsedDate, currentDate);

      if (isAfterCurrentDate) return false;

      return true;
    },
    {
      message: 'Invalid date format. Please use YYYY-MM-DD format.'
    }
  ),
  notifications: z.array(z.string()).min(1).max(3),
  category: z.string(),
  expiresAt: z.string().refine(
    (date) => {
      const currentDate = new TZDate(new Date(), 'America/Sao_Paulo');
      const parsedDate = new Date(date);

      if (isBefore(parsedDate, currentDate)) return false;

      return true;
    },
    {
      message: 'Invalid date format. Please use YYYY-MM-DD format.'
    }
  )
});

export type CreateProductInput = z.infer<typeof createProductRequestSchema>;
