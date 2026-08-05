import { format, isMatch, parseISO, subDays } from 'date-fns';
import { z } from 'zod';

/**
 * Client-safe half of the products module: types, validation, and date math.
 * Nothing here may import the API client — the add-product form is a client
 * component and pulls this into the browser bundle. Network calls live in
 * `./api.ts`, which is server-only.
 */

const DATE_FORMAT = 'yyyy-MM-dd';

export type Product = {
  id: string;
  accountId: string;
  name: string;
  category: string;
  buyedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

function dateField(message: string, direction: 'past' | 'future') {
  return z.string().superRefine((value, ctx) => {
    if (!isMatch(value, DATE_FORMAT)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use o formato AAAA-MM-DD.' });
      return;
    }

    const todayValue = today();
    const isInvalid = direction === 'past' ? value > todayValue : value < todayValue;

    if (isInvalid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });
}

/**
 * Mirrors `createProductRequestSchema` in the API so the form can reject bad
 * input without a round trip. The API stays authoritative — it validates against
 * São Paulo's "today", which can differ from the browser's by a few hours.
 */
export const createProductFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome do produto.'),
  category: z.string().min(1, 'Informe a categoria.'),
  buyedAt: dateField('A data de compra não pode ser no futuro.', 'past'),
  expiresAt: dateField('A data de validade deve ser no futuro.', 'future'),
  notifications: z
    .array(dateField('Data de aviso inválida.', 'future'))
    .min(1, 'Escolha ao menos um aviso.')
    .max(3, 'No máximo três avisos por produto.')
});

export type CreateProductInput = z.infer<typeof createProductFormSchema>;

export function today() {
  return format(new Date(), DATE_FORMAT);
}

/**
 * Notification lead times offered by the form, in days before expiry.
 */
export const NOTIFICATION_LEAD_TIMES = [7, 3, 1] as const;

/**
 * Turns selected lead times into the absolute `notify_at` dates the API stores.
 * Lead times that would land in the past are dropped; if every one does (an item
 * expiring tomorrow, say), we fall back to the expiry date itself, which is
 * always in the future for a valid product.
 */
export function resolveNotificationDates(expiresAt: string, leadTimes: number[]) {
  if (!isMatch(expiresAt, DATE_FORMAT)) return [];

  const expiry = parseISO(expiresAt);
  const todayValue = today();

  const dates = leadTimes
    .map((days) => format(subDays(expiry, days), DATE_FORMAT))
    .filter((date) => date >= todayValue);

  return dates.length > 0 ? [...new Set(dates)].sort() : [expiresAt];
}
