import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/shared/database/index.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { productsRepository } from '@/shared/database/repositories/products.ts';
import { memberships } from '@/shared/database/schemas/memberships.ts';
import { notifications } from '@/shared/database/schemas/notifications.ts';
import { createTestUser, dateOffset } from '@/shared/tests/factories.ts';
import { resetDb } from '@/shared/tests/setup.ts';

const sendCalls: Array<{ to: string[]; subject: string }> = [];
let sendShouldThrow: Error | null = null;

mock.module('@/shared/infra/mailer/index.ts', () => ({
  mailer: {
    emails: {
      send: async (msg: { to: string[]; subject: string }) => {
        if (sendShouldThrow) throw sendShouldThrow;
        sendCalls.push({ to: msg.to, subject: msg.subject });
        return { id: 'mock_msg' };
      }
    }
  }
}));

// Imported after mock.module() so the use case picks up the mocked mailer.
const { sendExpirationDigest } = await import('./use-case.ts');

const seedAccountWithProductAndNotification = async () => {
  const { user, account } = await createTestUser();

  return await db.transaction(async (tx) => {
    const { createProduct } = productsRepository(tx);
    const { createMany } = notificationsRepository(tx);

    const product = await createProduct({
      accountId: account.id,
      name: 'Milk',
      buyedAt: dateOffset(-2),
      expiresAt: dateOffset(2),
      category: 'dairy'
    });

    const [notification] = await createMany([
      { accountId: account.id, productId: product.id, notifyAt: dateOffset(0) }
    ]);

    return { user, account, notification: notification! };
  });
};

beforeEach(async () => {
  await resetDb();
  sendCalls.length = 0;
  sendShouldThrow = null;
});

describe('sendExpirationDigest', () => {
  test('sends email and marks notifications sent on success', async () => {
    const { user, account, notification } = await seedAccountWithProductAndNotification();

    const result = await sendExpirationDigest({
      accountId: account.id,
      notificationIds: [notification.id]
    });

    expect(result).toMatchObject({ sent: 1, accountId: account.id });
    expect(sendCalls).toHaveLength(1);
    expect(sendCalls[0]?.to).toEqual([user.email]);

    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id));
    expect(row?.status).toBe('sent');
  });

  test('marks notifications failed and rethrows when the mailer errors', async () => {
    const { account, notification } = await seedAccountWithProductAndNotification();
    sendShouldThrow = new Error('resend down');

    await expect(
      sendExpirationDigest({
        accountId: account.id,
        notificationIds: [notification.id]
      })
    ).rejects.toThrow('resend down');

    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id));
    expect(row?.status).toBe('failed');
  });

  test('skips and marks failed when the account has no owner', async () => {
    const { account, notification } = await seedAccountWithProductAndNotification();
    await db.delete(memberships);

    const result = await sendExpirationDigest({
      accountId: account.id,
      notificationIds: [notification.id]
    });

    expect(result).toMatchObject({ skipped: 'no-owner', accountId: account.id });
    expect(sendCalls).toHaveLength(0);

    const rows = await db
      .select()
      .from(notifications)
      .where(inArray(notifications.id, [notification.id]));
    expect(rows[0]?.status).toBe('failed');
  });
});
