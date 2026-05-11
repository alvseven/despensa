import { Hono } from 'hono';
import { Webhook } from 'svix';
import { z } from 'zod';

import { envs } from '@/shared/config/env.ts';
import { db } from '@/shared/database/index.ts';
import { accountsRepository } from '@/shared/database/repositories/accounts.ts';
import { membershipsRepository } from '@/shared/database/repositories/memberships.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';

const emailAddressSchema = z.object({
  id: z.string(),
  email_address: z.string().email()
});

const userDataSchema = z.object({
  id: z.string(),
  primary_email_address_id: z.string().nullable(),
  email_addresses: z.array(emailAddressSchema),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  image_url: z.string().nullable()
});

const userDeletedSchema = z.object({
  id: z.string(),
  deleted: z.boolean().optional()
});

const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user.created'), data: userDataSchema }),
  z.object({ type: z.literal('user.updated'), data: userDataSchema }),
  z.object({ type: z.literal('user.deleted'), data: userDeletedSchema })
]);

export const clerkWebhooksRoutes = new Hono();

clerkWebhooksRoutes.post('/', async (c) => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ message: 'Missing svix headers' }, STATUS_CODES.BAD_REQUEST);
  }

  const body = await c.req.text();

  let verified: unknown;
  try {
    verified = new Webhook(envs.CLERK_WEBHOOK_SECRET).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    });
  } catch (err) {
    console.error('Clerk webhook signature invalid:', err);
    return c.json({ message: 'Invalid signature' }, STATUS_CODES.UNAUTHORIZED);
  }

  const event = eventSchema.safeParse(verified);
  if (!event.success) {
    return c.body(null, STATUS_CODES.NO_CONTENT);
  }

  switch (event.data.type) {
    case 'user.created':
      await handleUserCreated(event.data.data);
      break;
    case 'user.updated':
      await handleUserUpdated(event.data.data);
      break;
    case 'user.deleted':
      await handleUserDeleted(event.data.data.id);
      break;
  }

  return c.body(null, STATUS_CODES.NO_CONTENT);
});

function resolveEmail(data: z.infer<typeof userDataSchema>) {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? null;
}

function resolveName(data: z.infer<typeof userDataSchema>) {
  return [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || 'Anonymous';
}

async function handleUserCreated(data: z.infer<typeof userDataSchema>) {
  const email = resolveEmail(data);

  if (!email) {
    console.error(`Clerk user.created for ${data.id} has no email — skipping`);
    return;
  }

  await db.transaction(async (tx) => {
    const { getUserByClerkId, createUser } = usersRepository(tx);
    const { createAccount } = accountsRepository(tx);
    const { createMembership } = membershipsRepository(tx);

    const existing = await getUserByClerkId(data.id);
    if (existing) return;

    const user = await createUser({
      clerkId: data.id,
      email,
      name: resolveName(data),
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

async function handleUserUpdated(data: z.infer<typeof userDataSchema>) {
  const { updateUserByClerkId } = usersRepository();
  const email = resolveEmail(data);

  await updateUserByClerkId({
    clerkId: data.id,
    ...(email ? { email } : {}),
    name: resolveName(data),
    avatarUrl: data.image_url
  });
}

async function handleUserDeleted(clerkId: string) {
  const { softDeleteUserByClerkId } = usersRepository();
  await softDeleteUserByClerkId(clerkId);
}
