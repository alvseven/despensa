import { eq } from "drizzle-orm";

import { db } from "../../shared/database/index.ts";
import { users, type User } from "../../shared/database/schemas/users.ts";

export const usersRepository = () => {
  const createUser = async (
    user: Pick<User, "email" | "password" | "name" | "avatarUrl">
  ) => {
    const [userCreated] = await db.insert(users).values(user).returning();

    return userCreated;
  };

  const getUserById = async (id: User["id"]) => {
    const [userFound] = await db.select().from(users).where(eq(users.id, id));

    return userFound;
  };

  const getUserByEmail = async (email: User["email"]) => {
    const [userFound] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return userFound;
  };

  const updateUserById = async ({
    id,
    ...user
  }: Partial<Pick<User, "email" | "password" | "name" | "avatarUrl">> &
    Pick<User, "id">) => {
    const [userUpdated] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();

    return userUpdated;
  };

  const deleteUserById = async (id: User["id"]) => {
    return db.delete(users).where(eq(users.id, id));
  };

  return {
    createUser,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById,
  };
};

export type UsersRepository = ReturnType<typeof usersRepository>;
