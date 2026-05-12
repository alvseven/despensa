import { usersRepository } from '@/shared/database/repositories/users.ts';

import { type ClerkUserData, resolveDisplayName, resolvePrimaryEmail } from '../schemas.ts';

export async function handleUserUpdated(data: ClerkUserData) {
  const email = resolvePrimaryEmail(data);

  await usersRepository().updateUserByClerkId({
    clerkId: data.id,
    ...(email ? { email } : {}),
    name: resolveDisplayName(data),
    avatarUrl: data.image_url
  });
}
