import { usersRepository } from '@/shared/database/repositories/users.ts';

import type { ClerkUserDeletedData } from '../schemas.ts';

export async function handleUserDeleted({ id }: ClerkUserDeletedData) {
  await usersRepository().softDeleteUserByClerkId(id);
}
