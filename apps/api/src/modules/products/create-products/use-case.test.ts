import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser, dateOffset } from '@/shared/tests/factories.ts';
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
        buyedAt: dateOffset(-2),
        expiresAt: dateOffset(8),
        category: 'fruit',
        notifications: [dateOffset(6)]
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
        expiresAt: dateOffset(8),
        category: 'fruit',
        notifications: [dateOffset(6)]
      })
    });

    expect(res.status).toBe(400);
  });

  test('rejects malformed notification dates', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/v1/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Apple',
        buyedAt: dateOffset(-2),
        expiresAt: dateOffset(8),
        category: 'fruit',
        notifications: ['banana']
      })
    });

    expect(res.status).toBe(400);
  });

  test('rejects past notification dates', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/v1/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Apple',
        buyedAt: dateOffset(-2),
        expiresAt: dateOffset(8),
        category: 'fruit',
        notifications: [dateOffset(-1)]
      })
    });

    expect(res.status).toBe(400);
  });
});
