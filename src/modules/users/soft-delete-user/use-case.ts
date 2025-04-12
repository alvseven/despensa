import { usersRepository } from '../repository.ts';
import type { SoftDeleteUserByIdInput } from './schemas.ts';

import { errorResponse, successResponse } from '../../../shared/infra/http/api-response.ts';
import { STATUS_CODES } from '../../../shared/infra/http/status-code.ts';

export async function softDeleteUserById({ id }: SoftDeleteUserByIdInput) {
  const { getUserById, softDeleteUserById } = usersRepository();

  const userFound = await getUserById(id);

  if (!userFound) {
    return errorResponse('User not found', STATUS_CODES.NOT_FOUND);
  }

  await softDeleteUserById(id);

  return successResponse(true, STATUS_CODES.NO_CONTENT);
}
