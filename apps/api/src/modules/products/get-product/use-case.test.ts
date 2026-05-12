import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser, dateOffset } from '@/shared/tests/factories.ts';
import { resetDb } from '@/shared/tests/setup.ts';

beforeEach(async () => {
  await resetDb();
});

const createProduct = async (token: string) => {
  const res = await app.request('/v1/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Apple',
      buyedAt: dateOffset(-2),
      expiresAt: dateOffset(8),
      category: 'fruit',
      notifications: [dateOffset(6)]
    })
  });
  return (await res.json()) as { id: string };
};

describe('GET /v1/products/:id', () => {
  test('returns the product when it belongs to the caller', async () => {
    const { token } = await createTestUser();
    const product = await createProduct(token);

    const res = await app.request(`/v1/products/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe(product.id);
  });

  test('returns 404 when the product belongs to another account', async () => {
    const alice = await createTestUser({ name: 'Alice' });
    const bob = await createTestUser({ name: 'Bob' });

    const aliceProduct = await createProduct(alice.token);

    const res = await app.request(`/v1/products/${aliceProduct.id}`, {
      headers: { Authorization: `Bearer ${bob.token}` }
    });

    expect(res.status).toBe(404);
  });

  test('returns 404 for a missing id', async () => {
    const { token } = await createTestUser();
    const res = await app.request('/v1/products/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status).toBe(404);
  });
});
