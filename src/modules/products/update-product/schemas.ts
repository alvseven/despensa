import { TZDate } from '@date-fns/tz';
import { isAfter, isBefore } from 'date-fns';
import { z } from 'zod';

export const updateProductByIdRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).optional(),
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
  ),  category: z.string(),
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
  )});

export type UpdateProductByIdInput = z.infer<typeof updateProductByIdRequestSchema>;
