import { differenceInCalendarDays } from 'date-fns';

import { envs } from '@/shared/config/env.ts';
import { membershipsRepository } from '@/shared/database/repositories/memberships.ts';
import { notificationsRepository } from '@/shared/database/repositories/notifications.ts';
import { productsRepository } from '@/shared/database/repositories/products.ts';
import { usersRepository } from '@/shared/database/repositories/users.ts';
import { mailer } from '@/shared/infra/mailer/index.ts';

type Input = {
  accountId: string;
  notificationIds: string[];
};

export async function sendExpirationDigest({ accountId, notificationIds }: Input) {
  const { getNotificationById, markNotificationAsSent, markNotificationAsFailed } =
    notificationsRepository();
  const { getOwnerByAccountId } = membershipsRepository();
  const { getUserById } = usersRepository();
  const { getProductByIdAndAccountId } = productsRepository();

  const notifications = (await Promise.all(notificationIds.map(getNotificationById))).filter(
    (n): n is NonNullable<typeof n> => Boolean(n) && n.accountId === accountId
  );

  if (notifications.length === 0) {
    return { skipped: 'no-notifications', accountId };
  }

  const owner = await getOwnerByAccountId(accountId);
  if (!owner) {
    await Promise.all(notifications.map((n) => markNotificationAsFailed(n.id)));
    return { skipped: 'no-owner', accountId };
  }

  const user = await getUserById(owner.userId);
  if (!user || user.deletedAt) {
    await Promise.all(notifications.map((n) => markNotificationAsFailed(n.id)));
    return { skipped: 'no-user', accountId };
  }

  const products = (
    await Promise.all(
      notifications.map((n) => getProductByIdAndAccountId({ id: n.productId, accountId }))
    )
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (products.length === 0) {
    await Promise.all(notifications.map((n) => markNotificationAsFailed(n.id)));
    return { skipped: 'no-products', accountId };
  }

  const today = new Date();
  const items = products.map((product) => ({
    name: product.name,
    daysToExpire: differenceInCalendarDays(new Date(product.expiresAt), today)
  }));

  const html = buildDigestHtml(user.name, items);

  try {
    await mailer.emails.send({
      from: 'Despensa <hello@despensa.com>',
      to: [user.email],
      subject: `${items.length} item${items.length === 1 ? '' : 's'} prestes a vencer na sua despensa`,
      html
    });

    await Promise.all(notifications.map((n) => markNotificationAsSent(n.id)));

    return { sent: notifications.length, accountId };
  } catch (error) {
    await Promise.all(notifications.map((n) => markNotificationAsFailed(n.id)));
    throw error;
  }
}

function buildDigestHtml(userName: string, items: { name: string; daysToExpire: number }[]) {
  const rows = items
    .map(({ name, daysToExpire }) => {
      const label =
        daysToExpire <= 0
          ? 'vence hoje'
          : `vence em ${daysToExpire} dia${daysToExpire === 1 ? '' : 's'}`;
      return `<li style="margin: 8px 0;"><strong>${escapeHtml(name)}</strong> — ${label}</li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: -apple-system, system-ui, sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Olá, ${escapeHtml(userName)} 👋</h1>
    <p style="line-height: 1.5;">Estes itens da sua despensa estão prestes a vencer:</p>
    <ul style="padding-left: 20px;">${rows}</ul>
    <p style="line-height: 1.5; color: #666; font-size: 14px; margin-top: 24px;">
      Aproveite-os antes que estraguem. Você pode atualizar ou remover esses itens em
      <a href="https://app.despensa.com">app.despensa.com</a>.
    </p>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
