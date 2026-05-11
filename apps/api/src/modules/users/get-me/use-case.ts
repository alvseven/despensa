import { eq } from 'drizzle-orm';

import { db } from '@/shared/database/index.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { accounts } from '@/shared/database/schemas/accounts.ts';
import { memberships } from '@/shared/database/schemas/memberships.ts';
import { errorResponse, successResponse } from '@/shared/infra/http/api-response.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

export async function getMe({ userId }: { userId: string }) {
  const { getUserById } = usersRepository();

  const user = await getUserById(userId);

  if (!user || user.deletedAt) {
    return errorResponse('User not found', STATUS_CODES.NOT_FOUND);
  }

  const userAccounts = await db
    .select({
      id: accounts.id,
      type: accounts.type,
      name: accounts.name,
      role: memberships.role
    })
    .from(memberships)
    .innerJoin(accounts, eq(memberships.accountId, accounts.id))
    .where(eq(memberships.userId, userId));

  return successResponse(
    {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      accounts: userAccounts
    },
    STATUS_CODES.OK
  );
}
