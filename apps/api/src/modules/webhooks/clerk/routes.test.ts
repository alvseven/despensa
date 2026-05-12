import { beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { Webhook } from 'svix';

import { app } from '@/shared/app.ts';
import { db } from '@/shared/database/index.ts';
import { accounts } from '@/shared/database/schemas/accounts.ts';
import { memberships } from '@/shared/database/schemas/memberships.ts';
import { users } from '@/shared/database/schemas/users.ts';
import { resetDb } from '@/shared/tests/setup.ts';

beforeEach(async () => {
  await resetDb();
});

// Must match the value setup.ts puts into process.env.CLERK_WEBHOOK_SECRET so
// the route handler verifies against the same secret we sign with.
const TEST_SECRET = process.env.CLERK_WEBHOOK_SECRET || 'test_webhook_secret';

let svixId = 0;
const signedRequest = (event: Record<string, unknown>) => {
  const body = JSON.stringify(event);
  const msgId = `msg_${++svixId}`;
  const timestamp = new Date();
  const signature = new Webhook(TEST_SECRET).sign(msgId, timestamp, body);

  return app.request('/webhooks/clerk', {
    method: 'POST',
    headers: {
      'svix-id': msgId,
      'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
      'svix-signature': signature,
      'content-type': 'application/json'
    },
    body
  });
};

const clerkUser = (overrides: Partial<{ id: string; email: string; firstName: string }> = {}) => ({
  id: overrides.id ?? 'clerk_user_1',
  primary_email_address_id: 'email_1',
  email_addresses: [{ id: 'email_1', email_address: overrides.email ?? 'a@b.com' }],
  first_name: overrides.firstName ?? 'Ada',
  last_name: 'Lovelace',
  image_url: null
});

describe('POST /webhooks/clerk', () => {
  test('rejects requests with no svix headers', async () => {
    const res = await app.request('/webhooks/clerk', {
      method: 'POST',
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
  });

  test('rejects requests with an invalid signature', async () => {
    const body = JSON.stringify({ type: 'user.created', data: clerkUser() });
    const res = await app.request('/webhooks/clerk', {
      method: 'POST',
      headers: {
        'svix-id': 'msg_bad',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'v1,deadbeef',
        'content-type': 'application/json'
      },
      body
    });
    expect(res.status).toBe(401);
  });

  test('user.created provisions user + personal account + owner membership', async () => {
    const res = await signedRequest({ type: 'user.created', data: clerkUser() });
    expect(res.status).toBe(204);

    const [user] = await db.select().from(users).where(eq(users.clerkId, 'clerk_user_1'));
    expect(user).toBeDefined();
    expect(user?.email).toBe('a@b.com');

    const [account] = await db.select().from(accounts);
    expect(account?.type).toBe('personal');

    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, user!.id));
    expect(membership?.role).toBe('owner');
    expect(membership?.accountId).toBe(account!.id);
  });

  test('user.created is idempotent', async () => {
    await signedRequest({ type: 'user.created', data: clerkUser() });
    const second = await signedRequest({ type: 'user.created', data: clerkUser() });
    expect(second.status).toBe(204);

    const rows = await db.select().from(users);
    expect(rows).toHaveLength(1);
  });

  test('user.updated syncs denormalized fields', async () => {
    await signedRequest({ type: 'user.created', data: clerkUser() });
    const res = await signedRequest({
      type: 'user.updated',
      data: clerkUser({ email: 'new@b.com', firstName: 'Grace' })
    });
    expect(res.status).toBe(204);

    const [user] = await db.select().from(users).where(eq(users.clerkId, 'clerk_user_1'));
    expect(user?.email).toBe('new@b.com');
    expect(user?.name).toBe('Grace Lovelace');
  });

  test('user.deleted soft-deletes', async () => {
    await signedRequest({ type: 'user.created', data: clerkUser() });
    const res = await signedRequest({
      type: 'user.deleted',
      data: { id: 'clerk_user_1', deleted: true }
    });
    expect(res.status).toBe(204);

    const [user] = await db.select().from(users).where(eq(users.clerkId, 'clerk_user_1'));
    expect(user?.deletedAt).not.toBeNull();
  });

  test('ignores unknown event types without erroring', async () => {
    const res = await signedRequest({
      type: 'session.created',
      data: { id: 'sess_1' }
    });
    expect(res.status).toBe(204);
  });
});
