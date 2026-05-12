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

describe('DELETE /v1/products/:id', () => {
  test('removes the product and is idempotent', async () => {
    const { token } = await createTestUser();
    const product = await createProduct(token);

    const first = await app.request(`/v1/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(first.status).toBe(204);

    const after = await app.request(`/v1/products/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(after.status).toBe(404);

    // Deleting again still returns 204.
    const second = await app.request(`/v1/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(second.status).toBe(204);
  });

  test('does not touch another account products', async () => {
    const alice = await createTestUser({ name: 'Alice' });
    const bob = await createTestUser({ name: 'Bob' });
    const aliceProduct = await createProduct(alice.token);

    const res = await app.request(`/v1/products/${aliceProduct.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bob.token}` }
    });
    // DELETE is idempotent and account-scoped — bob gets 204 but the row stays.
    expect(res.status).toBe(204);

    const stillThere = await app.request(`/v1/products/${aliceProduct.id}`, {
      headers: { Authorization: `Bearer ${alice.token}` }
    });
    expect(stillThere.status).toBe(200);
  });
});
