import { usersRepository } from '@/shared/database/repositories/users.ts';

import type { ClerkUserData } from '../schemas.ts';

export async function handleUserUpdated(data: ClerkUserData) {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
  const email = primary?.email_address ?? data.email_addresses[0]?.email_address ?? null;
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || 'Anonymous';

  await usersRepository().updateUserByClerkId({
    clerkId: data.id,
    ...(email ? { email } : {}),
    name,
    avatarUrl: data.image_url
  });
}
