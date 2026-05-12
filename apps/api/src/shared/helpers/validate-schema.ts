import type { ZodSchema, z } from 'zod';

import { zodCustomErrorMap } from '@/shared/config/zod-custom-error-map.ts';

export const validateSchema = <Schema extends ZodSchema>(
  schema: Schema,
  data: Record<keyof z.infer<Schema>, unknown>,
  fields: Array<keyof z.infer<Schema>> = []
): z.infer<Schema> => {
  return schema.parse(data, { errorMap: zodCustomErrorMap(fields) });
};
