import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { TZDate } from '@date-fns/tz';
import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type Validation, validations } from '../schemas/validations.ts';

export const validationRepository = () => {
  const createValidation = async (
    validation: Pick<Validation, 'code' | 'identifier' | 'type' | 'expiresAt'>
  ) => {
    const [createdValidation] = await db.insert(validations).values(validation).returning();

    return createdValidation;
  };

  const getValidationByIdentifier = async (identifier: Validation['identifier']) => {
    const [validation] = await db
      .select()
      .from(validations)
      .where(eq(validations.identifier, identifier));

    return validation;
  };

  const setValidationCodeAsUsed = async (
    code: Validation['code'],
    tx: NodePgDatabase<typeof schema> = db
  ) => {
    const usedAtDate = new TZDate(new Date(), 'America/Sao_Paulo');

    await tx.update(validations).set({ usedAt: usedAtDate }).where(eq(validations.code, code));
  };

  const setValidationCodeAsExpired = async (code: Validation['code']) => {
    const expiresAtDate = new TZDate(new Date(), 'America/Sao_Paulo');

    await db
      .update(validations)
      .set({ expiresAt: expiresAtDate })
      .where(eq(validations.code, code));
  };

  const getValidationByCode = async (code: Validation['code']) => {
    const [validation] = await db.select().from(validations).where(eq(validations.code, code));

    return validation;
  };

  const updateValidationByCode = async (
    validation: Pick<Validation, 'code' | 'identifier' | 'type'>
  ) => {
    return await db
      .update(validations)
      .set(validation)
      .where(eq(validations.code, validation.code));
  };

  const deleteValidationByCode = async (code: Validation['code']) => {
    await db.delete(validations).where(eq(validations.code, code));
  };

  return {
    createValidation,
    getValidationByIdentifier,
    setValidationCodeAsUsed,
    setValidationCodeAsExpired,
    getValidationByCode,
    updateValidationByCode,
    deleteValidationByCode
  };
};
