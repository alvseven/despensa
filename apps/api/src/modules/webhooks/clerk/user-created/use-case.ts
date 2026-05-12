import { db } from '@/shared/database/index.ts';
import { accountsRepository } from '@/shared/database/repositories/accounts.ts';
import { membershipsRepository } from '@/shared/database/repositories/memberships.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { logger } from '@/shared/infra/observability/logger.ts';

import { type ClerkUserData, resolveDisplayName, resolvePrimaryEmail } from '../schemas.ts';

export async function handleUserCreated(data: ClerkUserData) {
  const email = resolvePrimaryEmail(data);

  if (!email) {
    logger.warn({ clerkId: data.id }, 'clerk user.created skipped — no email');
    return;
  }

  await db.transaction(async (tx) => {
    const { getUserByClerkId, createUser } = usersRepository(tx);
    const { createAccount } = accountsRepository(tx);
    const { createMembership } = membershipsRepository(tx);

    if (await getUserByClerkId(data.id)) return;

    const user = await createUser({
      clerkId: data.id,
      email,
      name: resolveDisplayName(data),
      avatarUrl: data.image_url
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
  });
}
