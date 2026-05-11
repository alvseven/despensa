import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type User, users } from '../schemas/users.ts';

type Tx = NodePgDatabase<typeof schema>;

export const usersRepository = (tx: Tx = db) => {
  const createUser = async (user: Pick<User, 'clerkId' | 'email' | 'name' | 'avatarUrl'>) => {
    const [created] = await tx.insert(users).values(user).returning();
    return created;
  };

  const getUserById = async (id: User['id']) => {
    const [userFound] = await tx.select().from(users).where(eq(users.id, id));
    return userFound;
  };

  const getUserByClerkId = async (clerkId: User['clerkId']) => {
    const [userFound] = await tx.select().from(users).where(eq(users.clerkId, clerkId));
    return userFound;
  };

  const updateUserByClerkId = async ({
    clerkId,
    ...patch
  }: Pick<User, 'clerkId'> & Partial<Pick<User, 'email' | 'name' | 'avatarUrl'>>) => {
    const [updated] = await tx
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
      .returning();
    return updated;
  };

  const softDeleteUserByClerkId = async (clerkId: User['clerkId']) => {
    return await tx
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
      .returning();
  };

  return {
    createUser,
    getUserById,
    getUserByClerkId,
    updateUserByClerkId,
    softDeleteUserByClerkId
  };
};
