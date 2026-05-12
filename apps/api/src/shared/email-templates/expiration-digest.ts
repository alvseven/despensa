export type ExpirationItem = {
  name: string;
  daysToExpire: number;
};

export type ExpirationDigestProps = {
  userName: string;
  items: ExpirationItem[];
  appUrl?: string;
};

export function renderExpirationDigest({
  userName,
  items,
  appUrl = 'https://app.despensa.ai'
}: ExpirationDigestProps): string {
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
      <a href="${appUrl}">${appUrl.replace('https://', '')}</a>.
    </p>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
