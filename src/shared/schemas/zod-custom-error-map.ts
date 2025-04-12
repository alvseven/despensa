import { type ZodErrorMap, type ZodSchema, ZodType, z } from 'zod';

type Error = Parameters<ZodErrorMap>['0'];
type Ctx = Parameters<ZodErrorMap>['1'];
type Field = string | number | undefined;

const handleInvalidTypeError = (error: z.ZodInvalidTypeIssue, ctx: Ctx, field: Field) => {
  const { received, expected } = error;

  if (received === 'undefined') {
    return { message: `The field '${field}' is required` };
  }

  switch (expected) {
    case 'string':
      return { message: `The field '${field}' should be a string` };

    case 'number':
      return { message: `The field '${field}' should be a number` };
  }

  return { message: ctx.defaultError };
};

const handleTooSmallError = (error: z.ZodTooSmallIssue, ctx: Ctx, field: Field) => {
  const { type, minimum } = error;

  switch (type) {
    case 'string':
      if (error.exact) {
        return {
          message: `The field '${field}' should contain ${minimum} characters`
        };
      }
      return {
        message: `The field '${field}' should contain at least ${minimum} characters`
      };

    case 'number':
      if (error.exact) {
        return {
          message: `The field '${field}' should be greater than ${minimum}`
        };
      }
      return {
        message: `The field '${field}' should be greater or equal to ${minimum}`
      };
  }

  return { message: ctx.defaultError };
};

    const handleTooBigError = (error: z.ZodTooBigIssue, ctx: Ctx, field: Field) => {
  const {         type, maximum } = error;

  switch    ( type) {
    case 'string':
      if (error.exact) {
        return {
          message: `The field '${field}' should contain ${maximum} characters`
        };
      }
      return {
        message: `The field '${field}' should contain at most ${maximum} characters`
      };

    case 'number':
      if (error.exact) {
        return {
          message: `The field '${field}' should be equal to ${maximum}`
        };
      }
      return {
        message: `The field '${field}' should be less or equal to ${maximum}`
      };
  }

  return { message: ctx.defaultError };
};

const handleInvalidStringError = (error: z.ZodInvalidStringIssue, ctx: Ctx, field: Field) => {
  const { validation } = error;

  switch (validation) {
    case 'email':
      return { message: `The field '${field}' should be a valid email` };

    case 'uuid':
      return { message: `The field '${field}' should be a valid UUID` };

    default:
      return { message: ctx.defaultError };
  }
};

export const zodCustomErrorMap: <Schema extends ZodSchema>(
  fields?: Array<keyof z.infer<Schema>>
) => ZodErrorMap =
  (fields = []) =>
  (error: Error, ctx: Ctx) => {
    const { code, path } = error;

    const currentField = path.at(-1);

    const hasToIgnoreField = fields.includes(currentField!);

    if (hasToIgnoreField) {
      return { message: ctx.defaultError };
    }

    switch (code) {
      case z.ZodIssueCode.invalid_type:
        return handleInvalidTypeError(error, ctx, currentField);

      case z.ZodIssueCode.too_small:
        return handleTooSmallError(error, ctx, currentField);

      case z.ZodIssueCode.too_big:
        return handleTooBigError(error, ctx, currentField);

      case z.ZodIssueCode.invalid_string:
        return handleInvalidStringError(error, ctx, currentField);

      default:
        return { message: ctx.defaultError };
    }
  };
