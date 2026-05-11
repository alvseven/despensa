import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import { type Account, accounts } from '../schemas/accounts.ts';
import type * as schema from '../schemas/index.ts';

type Tx = NodePgDatabase<typeof schema>;

export const accountsRepository = (tx: Tx = db) => {
  const createAccount = async (account: Pick<Account, 'name' | 'type'>) => {
    const [createdAccount] = await tx.insert(accounts).values(account).returning();

    return createdAccount;
  };

  const getAccountById = async (id: Account['id']) => {
    const [account] = await tx.select().from(accounts).where(eq(accounts.id, id));

    return account;
  };

  return { createAccount, getAccountById };
};
