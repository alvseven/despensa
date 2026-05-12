import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser } from '@/shared/tests/factories.ts';
import { resetDb } from '@/shared/tests/setup.ts';

beforeEach(async () => {
  await resetDb();
});

describe('POST /v1/products', () => {
  test('creates a product scoped to the caller account', async () => {
    const { token, account } = await createTestUser();

    const res = await app.request('/v1/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Apple',
        buyedAt: '2026-05-10',
        expiresAt: '2026-05-20',
        category: 'fruit',
        notifications: ['2026-05-18']
      })
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; accountId: string; name: string };
    expect(body.accountId).toBe(account.id);
    expect(body.name).toBe('Apple');
  });

  test('rejects unauthenticated requests', async () => {
    const res = await app.request('/v1/products', { method: 'POST', body: '{}' });
    expect(res.status).toBe(401);
  });

  test('rejects invalid date format', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/v1/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Apple',
        buyedAt: 'not-a-date',
        expiresAt: '2026-05-20',
        category: 'fruit',
        notifications: ['2026-05-18']
      })
    });

    expect(res.status).toBe(400);
  });
});
