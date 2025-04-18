import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type User, users } from '../schemas/users.ts';

export const usersRepository = () => {
  const createUser = async (
    user: Pick<User, 'email' | 'password' | 'name' | 'avatarUrl' > & { phoneNumber?: User['phoneNumber'] }
  ) => {
    const [userCreated] = await db.insert(users).values(user).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      phoneNumber: users.phoneNumber
    });

    return userCreated;
  };

  const createUserWithGoogle = async (
    user: Pick<User, 'email' | 'name' | 'avatarUrl' | 'phoneNumber' | 'providerId'>
  ) => {
    const [userCreated] = await db.insert(users).values({
      ...user,
      provider: 'google',
    }).returning({
      id: users.id,
      name: users.name, 
      email: users.email,
      avatarUrl: users.avatarUrl,
      phoneNumber: users.phoneNumber
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

  const getUserByEmailAndProviderId = async (
    email: User['email'],
    providerId: NonNullable<User['providerId']>
  ) => {
    const [userFound] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.providerId, providerId)));

    return userFound;
  };

  const getUserByPhoneNumber = async (phoneNumber: NonNullable<User['phoneNumber']>) => {
    const [userFound] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));

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
    return await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
  };

  const setUserEmailVerified = async (id: User['id'], tx: NodePgDatabase<typeof schema> = db) => {
    return await tx.update(users).set({ isEmailVerified: true }).where(eq(users.id, id));
  };

  const setUserPhoneVerified = async (id: User['id']) => {
    return await db.update(users).set({ isPhoneVerified: true }).where(eq(users.id, id));
  };

  return {
    createUser,
    createUserWithGoogle,
    getUserById,
    getUserByEmail,
    getUserByEmailAndProviderId,
    getUserByPhoneNumber,
    updateUserById,
    softDeleteUserById,
    setUserEmailVerified,
    setUserPhoneVerified
  };
};
