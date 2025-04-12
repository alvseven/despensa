import bcrypt from 'bcryptjs';

import { usersRepository } from '../repository.ts';
import type { CreateUserInput } from './schemas.ts';

import { envs } from '../../../shared/config/env.ts';
import { errorResponse, successResponse } from '../../../shared/infra/http/api-response.ts';
import { STATUS_CODES } from '../../../shared/infra/http/status-code.ts';

export async function createUser(user: CreateUserInput) {
  const { getUserByEmail, createUser } = usersRepository();

  const userFound = await getUserByEmail(user.email);

  const hashedPassword = await bcrypt.hash(user.password, envs.PASSWORD_SALT_ROUNDS);

  if (userFound) {
    return errorResponse('Email already exists', STATUS_CODES.CONFLICT);
  }

  const createdUser = await createUser({
    ...user,
    password: hashedPassword
  });

  return successResponse(createdUser, STATUS_CODES.CREATED);
}
