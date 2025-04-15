import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';

import { usersRepository } from '@/shared/database/repositories/users.ts';
import type { AuthenticateUserInput } from './schemas.ts';

import { envs } from '@/shared/config/env.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function authenticateUser({ password, email }: AuthenticateUserInput) {
  const { getUserByEmail } = usersRepository();

  const userFound = await getUserByEmail(email);

  if (!userFound) {
    return errorResponse('Invalid credentials', STATUS_CODES.UNAUTHORIZED);
  }

  const passwordsMatch = await bcrypt.compare(password, userFound.password);

  if (!passwordsMatch) {
    return errorResponse('Invalid credentials', STATUS_CODES.UNAUTHORIZED);
  }

  const currentTimeInSeconds = Math.floor(Date.now() / 100);

  const payload = {
    sub: { email: userFound.email, id: userFound.id },
    exp: currentTimeInSeconds + envs.JWT_EXPIRATION
  };

  const token = await sign(payload, envs.JWT_SECRET);

  return successResponse({ ...userFound, password: undefined, token }, 200);
}
