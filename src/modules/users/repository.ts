import { eq } from 'drizzle-orm';

import { db } from '../../shared/database/index.ts';
import { type User, users } from '../../shared/database/schemas/users.ts';

export const usersRepository = () => {
  const createUser = async (user: Pick<User, 'email' | 'password' | 'name' | 'avatarUrl'>) => {
    const [userCreated] = await db.insert(users).values(user).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl
    });

    return userCreated;
  };

  const getUserById = async (id: User['id']) => {
    const [userFound] = await db.query.users.findMany({
      with: {
        products: true
      },
      columns: {
        password: false
      },
      where: eq(users.id, id)
    });

    return userFound;
  };

  const getUserByEmail = async (email: User['email']) => {
    const [userFound] = await db.select().from(users).where(eq(users.email, email));

    return userFound;
  };

  const updateUserById = async ({
    id,
    ...user
  }: Partial<Pick<User, 'email' | 'password' | 'name' | 'avatarUrl'>> & Pick<User, 'id'>) => {
    const [userUpdated] = await db.update(users).set(user).where(eq(users.id, id)).returning();

    return userUpdated;
  };

  const softDeleteUserById = async (id: User['id']) => {
    return db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id)).returning();
  };

  return {
    createUser,
    getUserById,
    getUserByEmail,
    updateUserById,
    softDeleteUserById
  };
};
