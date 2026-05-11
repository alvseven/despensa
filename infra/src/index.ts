/**
 * Despensa backend infrastructure.
 *
 * Scope: api.despensa.com only. The /apps/app and /apps/www frontends
 * deploy via Vercel and are not managed here.
 *
 * Hosting decisions pending. Likely shape once chosen:
 *   - DNS:     Cloudflare (api.despensa.com → backend host)
 *   - Compute: AWS App Runner OR Fly.io (TBD)
 *   - DB:      Neon serverless Postgres (managed via Neon's own dashboard,
 *              not Pulumi — no official provider yet)
 *   - Secrets: per-provider (Pulumi config set --secret)
 */

import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const env = config.require('env');
const domain = config.require('domain');

export const meta = {
  env,
  domain
};
