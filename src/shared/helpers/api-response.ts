import type { ContentfulStatusCode } from "hono/utils/http-status";

type ErrorResult = [
  {
    code: ContentfulStatusCode;
    message: string;
  },
  null
];

type SuccessResult<T> = [
  null,
  {
    code: ContentfulStatusCode;
    data: T;
  }
];

export const successResponse = <T>(
  data: T,
  code: ContentfulStatusCode = 200
): SuccessResult<T> => {
  return [
    null,
    {
      code,
      data,
    },
  ];
};

export const errorResponse = (
  message: string,
  code: ContentfulStatusCode
): ErrorResult => {
  return [{ message, code }, null];
};
