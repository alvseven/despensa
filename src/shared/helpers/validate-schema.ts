import type { ZodSchema, z } from 'zod';

import { type ErrorStatusCode, STATUS_CODES } from '../infra/http/status-code.ts';
import { zodCustomErrorMap } from '../schemas/zod-custom-error-map.ts';

export const validateSchema = <Schema extends ZodSchema>(
  schema: Schema,
  data: Record<keyof z.infer<Schema>, unknown>,
  fields: Array<keyof z.infer<Schema>> = []
): [null, { data: z.infer<Schema> }] | [{ message: any; code: ErrorStatusCode }, null] => {
  const result = schema.safeParse(data, {
    errorMap: zodCustomErrorMap(fields)
  });

  if (result.error) {
    return [
      {
        message: Object.values(result.error.flatten().fieldErrors).flat(),
        code: STATUS_CODES.BAD_REQUEST
      },
      null
    ];
  }

  return [
    null,
    {
      data: result.data
    }
  ];
};
