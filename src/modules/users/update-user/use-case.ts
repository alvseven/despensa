import { usersRepository } from '../repository.ts';
import type { UpdateUserByIdInput } from './schemas.ts';

import { errorResponse, successResponse } from '../../../shared/infra/http/api-response.ts';
import { STATUS_CODES } from '../../../shared/infra/http/status-code.ts';

export async function updateUserById(user: UpdateUserByIdInput) {
  const { getUserById, updateUserById } = usersRepository();

  const userFound = await getUserById(user.id);

  if (!userFound) {
    return errorResponse('User not found', STATUS_CODES.NOT_FOUND);
  }

  const updatedUser = await updateUserById(user);

  return successResponse(updatedUser, 200);
}
