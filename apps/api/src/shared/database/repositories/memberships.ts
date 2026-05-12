import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { db } from '../index.ts';
import type * as schema from '../schemas/index.ts';
import { type Membership, memberships } from '../schemas/memberships.ts';

type Tx = NodePgDatabase<typeof schema>;

export const membershipsRepository = (tx: Tx = db) => {
  const createMembership = async (
    membership: Pick<Membership, 'accountId' | 'userId' | 'role'>
  ) => {
    const [created] = await tx.insert(memberships).values(membership).returning();
    return created;
  };

  const getMembershipsByUserId = async (userId: Membership['userId']) => {
    return await tx.select().from(memberships).where(eq(memberships.userId, userId));
  };

  return { createMembership, getMembershipsByUserId };
};
