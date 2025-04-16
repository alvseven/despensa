import type { GetUserByIdInput } from './schemas.ts';

import { usersRepository } from '@/shared/database/repositories/users.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function getUserById({ id }: GetUserByIdInput) {
  const { getUserById } = usersRepository();

  const userFound = await getUserById(id);

  if (!userFound) {
    return errorResponse('User not found', STATUS_CODES.NOT_FOUND);
  }

  return successResponse(userFound, 200);
}
