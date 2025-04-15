import { eq } from 'drizzle-orm';

import { db } from '../index.ts';
import { type Validation, validation as validationSchema } from '../schemas/validation.ts';

export const validationRepository = () => {
  const createValidation = async (validation: Pick<Validation, 'code' | 'identifier' | 'type'>) => {
    const [createdValidation] = await db
      .insert(validationSchema)
      .values(validation)
      .returning()
      .execute();

    return createdValidation;
  };

  const getValidationByCode = async (code: Validation['code']) => {
    const [validation] = await db
      .select()
      .from(validationSchema)
      .where(eq(validationSchema.code, code))
      .execute();

    return validation;
  };

  const updateValidationByCode = async (
    validation: Pick<Validation, 'code' | 'identifier' | 'type'>
  ) => {
    const [updatedValidation] = await db
      .update(validationSchema)
      .set(validation)
      .where(eq(validationSchema.code, validation.code))
      .returning()
      .execute();

    return updatedValidation;
  };

  const deleteValidationByCode = async (code: Validation['code']) => {
    await db.delete(validationSchema).where(eq(validationSchema.code, code)).execute();
  };

  return {
    createValidation,
    getValidationByCode,
    updateValidationByCode,
    deleteValidationByCode
  };
};

export type ValidationRepository = ReturnType<typeof validationRepository>;
