import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';

import { SAO_PAULO_TIME_ZONE } from '@/shared/constants/time-zone.ts';
import { db } from '@/shared/database/index.ts';
import { accountsRepository } from '@/shared/database/repositories/accounts.ts';
import { membershipsRepository } from '@/shared/database/repositories/memberships.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';

let counter = 0;

/**
 * `yyyy-MM-dd` offset from today in São Paulo. Use a negative offset for past
 * dates (buyedAt), positive for future (expiresAt, notifyAt). Keeps tests
 * stable as the clock moves.
 */
export const dateOffset = (days: number) =>
  format(addDays(new TZDate(new Date(), SAO_PAULO_TIME_ZONE), days), 'yyyy-MM-dd');

export async function createTestUser(overrides: Partial<{ name: string; email: string }> = {}) {
  counter += 1;
  const clerkId = `clerk_test_${counter}`;

  return await db.transaction(async (tx) => {
    const { createUser } = usersRepository(tx);
    const { createAccount } = accountsRepository(tx);
    const { createMembership } = membershipsRepository(tx);

    const user = await createUser({
      clerkId,
      email: overrides.email ?? `test${counter}@despensa.test`,
      name: overrides.name ?? `Test User ${counter}`,
      avatarUrl: null
    });

    const account = await createAccount({
      type: 'personal',
      name: `${user.name}'s pantry`
    });

    await createMembership({
      accountId: account.id,
      userId: user.id,
      role: 'owner'
    });

    return { user, account, token: `test_${clerkId}` };
  });
}
