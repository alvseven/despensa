import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { ErrorStatusCode, SuccessStatusCode } from './status-code.ts';

type ErrorResult<Code extends ErrorStatusCode> = [
  {
    code: Code;
    message: string;
  },
  null
];

type SuccessResult<
  T extends Record<string, unknown> | boolean | unknown[],
  Code extends SuccessStatusCode
> = [
  null,
  {
    code: Code;
    data: T;
  }
];

export type UseCaseResult<T extends Record<string, unknown> | boolean | unknown[]> =
  | ErrorResult<ErrorStatusCode>
  | SuccessResult<T, SuccessStatusCode>;

export const successResponse = <
  T extends Record<string, unknown> | boolean | unknown[],
  Code extends SuccessStatusCode
>(
  data: T,
  code: Code
): SuccessResult<T, Code> => {
  return [
    null,
    {
      code,
      data
    }
  ];
};

export const errorResponse = <Code extends ErrorStatusCode>(
  message: string,
  code: Code
): ErrorResult<Code> => {
  return [{ message, code }, null];
};

export const respond = <T extends Record<string, unknown> | boolean | unknown[]>(
  c: Context,
  result: UseCaseResult<T>
) => {
  const [error, response] = result;
  
  if (error) return c.json({ message: error.message }, error.code);

  return c.json(response.data, response.code as ContentfulStatusCode);
};
