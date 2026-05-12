import { and, asc, eq, isNull } from 'drizzle-orm';
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
    const [userFound] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    return userFound;
  };

  const getUserByClerkId = async (clerkId: User['clerkId']) => {
    const [userFound] = await tx
      .select()
      .from(users)
      .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)));
    return userFound;
  };

  const updateUserByClerkId = async ({
    clerkId,
    ...patch
  }: Pick<User, 'clerkId'> & Partial<Pick<User, 'email' | 'name' | 'avatarUrl'>>) => {
    const [updated] = await tx
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
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

  /**
   * Resolve a Clerk-authenticated user + their default account in one query.
   *
   * "Default account" today is the oldest membership the user has — every user
   * has exactly one (the personal account auto-created on signup). When B2B
   * lands and users start belonging to multiple accounts, replace this with
   * an explicit `users.default_account_id` column.
   */
  const getAuthContextByClerkId = async (clerkId: User['clerkId']) => {
    const [row] = await tx
      .select({
        userId: users.id,
        email: users.email,
        accountId: memberships.accountId
      })
      .from(users)
      .innerJoin(memberships, eq(memberships.userId, users.id))
      .where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
      .orderBy(asc(memberships.createdAt))
      .limit(1);
    return row;
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
    getAuthContextByClerkId,
    updateUserByClerkId,
    softDeleteUserByClerkId,
    getOwnerForAccount
  };
};
