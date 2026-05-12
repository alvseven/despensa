import { TZDate } from '@date-fns/tz';
import { isAfter, isBefore, isMatch } from 'date-fns';
import { z } from 'zod';

import { SAO_PAULO_TIME_ZONE } from '@/shared/constants/time-zone.ts';

const DATE_FORMAT = 'yyyy-MM-dd';

const today = () => new TZDate(new Date(), SAO_PAULO_TIME_ZONE);

const checkFormat = (date: string, ctx: z.RefinementCtx) => {
  if (!isMatch(date, DATE_FORMAT)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid date format. Please use YYYY-MM-DD format.'
    });
    return false;
  }
  return true;
};

export const pastDateField = z.string().superRefine((date, ctx) => {
  if (!checkFormat(date, ctx)) return;
  if (isAfter(new Date(date), today())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Date must be before current date.'
    });
  }
});

export const futureDateField = z.string().superRefine((date, ctx) => {
  if (!checkFormat(date, ctx)) return;
  if (isBefore(new Date(date), today())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Date must be after current date.'
    });
  }
});
