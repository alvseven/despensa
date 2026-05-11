import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser } from './factories.ts';
import { resetDb } from './setup.ts';

beforeEach(async () => {
  await resetDb();
});

describe('GET /users/me', () => {
  test('returns the authenticated user with their accounts', async () => {
    const { user, account, token } = await createTestUser({ name: 'Ada' });

    const res = await app.request('/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      name: string;
      accounts: Array<{ id: string; role: string }>;
    };

    expect(body.id).toBe(user.id);
    expect(body.name).toBe('Ada');
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0]?.id).toBe(account.id);
    expect(body.accounts[0]?.role).toBe('owner');
  });

  test('401 without a token', async () => {
    const res = await app.request('/users/me');
    expect(res.status).toBe(401);
  });
});
