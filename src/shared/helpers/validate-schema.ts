import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodSchema, z } from "zod";
import { zodCustomErrorMap } from "../dtos/zod-custom-error-map.ts";

export const validateSchema = <Schema extends ZodSchema>(
  schema: Schema,
  data: Record<keyof z.infer<Schema>, unknown>,
  fields: Array<keyof z.infer<Schema>> = []
):
  | [null, { data: z.infer<Schema> }]
  | [{ message: any; code: ContentfulStatusCode }, null] => {
  const result = schema.safeParse(data, {
    errorMap: zodCustomErrorMap(fields),
  });

  if (result.error) {
    return [
      {
        message: Object.values(result.error.flatten().fieldErrors).flat(),
        code: 400,
      },
      null,
    ];
  }

  return [
    null,
    {
      data: result.data,
    },
  ];
};
