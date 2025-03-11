import {
  errorResponse,
  successResponse,
} from "../../shared/helpers/api-response.ts";

import type { UsersRepository } from "./repository.ts";

import type {
  CreateUserInput,
  DeleteUserByIdInput,
  GetUserByIdInput,
  UpdateUserByIdInput,
} from "./schemas.ts";

export function usersService(usersRepository: UsersRepository) {
  async function createUser(user: CreateUserInput) {
    const userFound = await usersRepository.getUserByEmail(user.email);

    if (userFound) {
      return errorResponse("Email already exists", 409);
    }

    const createdUser = await usersRepository.createUser(user);

    return successResponse(createdUser, 201);
  }

  async function getUserById({ id }: GetUserByIdInput) {
    const userFound = await usersRepository.getUserById(id);

    // TODO: REMEMBER TO HANDLE IDOR MA FREND

    if (!userFound) {
      return errorResponse("User not found", 404);
    }

    return successResponse(userFound);
  }

  async function updateUserById(user: UpdateUserByIdInput) {
    const userFound = await usersRepository.getUserById(user.id);

    // TODO: REMEMBER TO HANDLE IDOR MA FREND

    if (!userFound) {
      return errorResponse("User not found", 404);
    }

    const updatedUser = await usersRepository.updateUserById(user);

    return successResponse(updatedUser, 200);
  }

  async function deleteUserById({ id }: DeleteUserByIdInput) {
    const userFound = await usersRepository.getUserById(id);

    // TODO: REMEMBER TO HANDLE IDOR MA FREND

    if (!userFound) {
      return errorResponse("User not found", 404);
    }

    await usersRepository.deleteUserById(id);

    return successResponse(true, 200); //  not used, and should be a 204;
  }

  return {
    createUser,
    getUserById,
    updateUserById,
    deleteUserById,
  };
}
