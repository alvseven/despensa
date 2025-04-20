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
