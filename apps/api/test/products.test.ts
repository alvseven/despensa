import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser } from './factories.ts';
import { resetDb } from './setup.ts';

beforeEach(async () => {
  await resetDb();
});

describe('POST /products', () => {
  test('creates a product scoped to the caller account', async () => {
    const { token, account } = await createTestUser();

    const res = await app.request('/products', {
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
    const res = await app.request('/products', { method: 'POST', body: '{}' });
    expect(res.status).toBe(401);
  });

  test('rejects invalid date format', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/products', {
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

describe('GET /products', () => {
  test('returns only the caller account products', async () => {
    const alice = await createTestUser({ name: 'Alice' });
    const bob = await createTestUser({ name: 'Bob' });

    await app.request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice apple',
        buyedAt: '2026-05-10',
        expiresAt: '2026-05-20',
        category: 'fruit',
        notifications: ['2026-05-18']
      })
    });

    await app.request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bob.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob banana',
        buyedAt: '2026-05-10',
        expiresAt: '2026-05-20',
        category: 'fruit',
        notifications: ['2026-05-18']
      })
    });

    const res = await app.request('/products/', {
      headers: { Authorization: `Bearer ${alice.token}` }
    });
    expect(res.status).toBe(200);
    const products = (await res.json()) as Array<{ name: string }>;
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe('Alice apple');
  });
});
