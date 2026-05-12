import { beforeEach, describe, expect, test } from 'bun:test';

import { app } from '@/shared/app.ts';
import { createTestUser } from '@/shared/tests/factories.ts';
import { resetDb } from '@/shared/tests/setup.ts';

beforeEach(async () => {
  await resetDb();
});

describe('GET /v1/products', () => {
  test('returns only the caller account products', async () => {
    const alice = await createTestUser({ name: 'Alice' });
    const bob = await createTestUser({ name: 'Bob' });

    await app.request('/v1/products', {
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

    await app.request('/v1/products', {
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
