import { eq } from 'drizzle-orm';

import { db } from '../../shared/database/index.ts';
import { type User, users } from '../../shared/database/schemas/users.ts';

export const authRepository = () => {
  const getUserByEmail = async (email: User['email']) => {
    const [userFound] = await db.select().from(users).where(eq(users.email, email));

    return userFound;
  };

  return {
    getUserByEmail
  };
};
