import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser, dateOffset } from '@/shared/tests/factories.ts';
import { resetDb } from '@/shared/tests/setup.ts';

beforeEach(async () => {
  await resetDb();
});

const createProduct = (token: string, name: string) =>
  app.request('/v1/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      buyedAt: dateOffset(-2),
      expiresAt: dateOffset(8),
      category: 'fruit',
      notifications: [dateOffset(6)]
    })
  });

describe('GET /v1/products', () => {
  test('returns only the caller account products', async () => {
    const alice = await createTestUser({ name: 'Alice' });
    const bob = await createTestUser({ name: 'Bob' });

    await createProduct(alice.token, 'Alice apple');
    await createProduct(bob.token, 'Bob banana');

    const res = await app.request('/v1/products', {
      headers: { Authorization: `Bearer ${alice.token}` }
    });
    expect(res.status).toBe(200);
    const products = (await res.json()) as Array<{ name: string }>;
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe('Alice apple');
  });
});
