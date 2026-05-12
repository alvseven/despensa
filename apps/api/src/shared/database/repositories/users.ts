import { and, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type { Account } from '../schemas/accounts.ts';
import type * as schema from '../schemas/index.ts';
import { memberships } from '../schemas/memberships.ts';
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

  const getOwnerForAccount = async (accountId: Account['id']) => {
    const [owner] = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .innerJoin(memberships, eq(memberships.userId, users.id))
      .where(
        and(
          eq(memberships.accountId, accountId),
          eq(memberships.role, 'owner'),
          isNull(users.deletedAt)
        )
      );
    return owner;
  };

  return {
    createUser,
    getUserById,
    getUserByClerkId,
    updateUserByClerkId,
    softDeleteUserByClerkId,
    getOwnerForAccount
  };
};
