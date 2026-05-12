import { differenceInCalendarDays } from 'date-fns';

import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { renderExpirationDigest } from '@/shared/email-templates/expiration-digest.ts';
import { mailer } from '@/shared/infra/mailer/index.ts';

import type { SendExpirationDigestInput } from './schemas.ts';

export async function sendExpirationDigest({
  accountId,
  notificationIds
}: SendExpirationDigestInput) {
  const { getOwnerForAccount } = usersRepository();
  const { getWithProductsForAccount, markManyAsSent, markManyAsFailed } = notificationsRepository();

  const owner = await getOwnerForAccount(accountId);
  if (!owner) {
    await markManyAsFailed(notificationIds);
    return { skipped: 'no-owner', accountId } as const;
  }

  const rows = await getWithProductsForAccount(notificationIds, accountId);
  if (rows.length === 0) {
    await markManyAsFailed(notificationIds);
    return { skipped: 'no-products', accountId } as const;
  }

  const today = new Date();
  const items = rows.map(({ product }) => ({
    name: product.name,
    daysToExpire: differenceInCalendarDays(new Date(product.expiresAt), today)
  }));

  const html = renderExpirationDigest({ userName: owner.name, items });
  const subject = `${items.length} item${items.length === 1 ? '' : 's'} prestes a vencer na sua despensa`;

  try {
    await mailer.emails.send({
      from: 'Despensa <notifications@despensa.ai>',
      to: [owner.email],
      subject,
      html
    });
    await markManyAsSent(notificationIds);
    return { sent: notificationIds.length, accountId } as const;
  } catch (error) {
    await markManyAsFailed(notificationIds);
    throw error;
  }
}
