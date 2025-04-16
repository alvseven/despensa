import { eq } from 'drizzle-orm';

import { db } from '../index.ts';
import { type Validation, validations } from '../schemas/validations.ts';

export const validationRepository = () => {
  const createValidation = async (
    validation: Pick<Validation, 'code' | 'identifier' | 'type' | 'expiresAt'>
  ) => {
    const [createdValidation] = await db.insert(validations).values(validation).returning();

    return createdValidation;
  };

  const getValidationByCode = async (code: Validation['code']) => {
    const [validation] = await db.select().from(validations).where(eq(validations.code, code));

    return validation;
  };

  const updateValidationByCode = async (
    validation: Pick<Validation, 'code' | 'identifier' | 'type'>
  ) => {
    const [updatedValidation] = await db
      .update(validations)
      .set(validation)
      .where(eq(validations.code, validation.code))
      .returning();

    return updatedValidation;
  };

  const deleteValidationByCode = async (code: Validation['code']) => {
    await db.delete(validations).where(eq(validations.code, code));
  };

  return {
    createValidation,
    getValidationByCode,
    updateValidationByCode,
    deleteValidationByCode
  };
};
