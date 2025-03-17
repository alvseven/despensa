import bcrypt from "bcryptjs";
import {
  errorResponse,
  successResponse,
} from "../../shared/helpers/api-response.ts";

import type { UsersRepository } from "./repository.ts";

import type {
  AuthenticateUserInput,
  CreateUserInput,
  DeleteUserByIdInput,
  GetUserByIdInput,
  UpdateUserByIdInput,
} from "./schemas.ts";
import { PASSWORD_SALT_ROUNDS } from "../../shared/config/password-salt-rounds.ts";
import { sign } from "hono/jwt";
import { envs } from "../../shared/config/env.ts";

export function usersService(usersRepository: UsersRepository) {
  async function createUser(user: CreateUserInput) {
    const userFound = await usersRepository.getUserByEmail(user.email);

    const hashedPassword = await bcrypt.hash(
      user.password,
      PASSWORD_SALT_ROUNDS
    );

    if (userFound) {
      return errorResponse("Email already exists", 409);
    }

    const createdUser = await usersRepository.createUser({
      ...user,
      password: hashedPassword,
    });

    return successResponse(createdUser, 201);
  }

  async function getUserById({ id }: GetUserByIdInput) {
    const userFound = await usersRepository.getUserById(id);

    if (!userFound) {
      return errorResponse("User not found", 404);
    }

    return successResponse(userFound);
  }

  async function updateUserById(user: UpdateUserByIdInput) {
    const userFound = await usersRepository.getUserById(user.id);

    if (!userFound) {
      return errorResponse("User not found", 404);
    }

    const updatedUser = await usersRepository.updateUserById(user);

    return successResponse(updatedUser, 200);
  }

  async function deleteUserById({ id }: DeleteUserByIdInput) {
    const userFound = await usersRepository.getUserById(id);

    if (!userFound) {
      return errorResponse("User not found", 404);
    }

    await usersRepository.deleteUserById(id);

    return successResponse(true, 200); //  not used, and should be a 204;
  }

  async function authenticateUser({ password, email }: AuthenticateUserInput) {
    const userFound = await usersRepository.getUserByEmail(email);

    if (!userFound) {
      return errorResponse("Invalid credentials", 401);
    }

    const passwordsMatch = await bcrypt.compare(password, userFound.password);

    if (!passwordsMatch) {
      return errorResponse("Invalid credentials", 401);
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 100);

    const payload = {
      sub: { email: userFound.email, id: userFound.id },
      exp: currentTimeInSeconds + envs.JWT_EXPIRATION,
    };

    const token = await sign(payload, envs.JWT_SECRET);

    return successResponse({ ...userFound, password: undefined, token }, 200);
  }

  return {
    createUser,
    getUserById,
    updateUserById,
    deleteUserById,
    authenticateUser,
  };
}
