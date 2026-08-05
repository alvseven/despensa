import 'server-only';

import { z } from 'zod';

/**
 * Server-only env. Clerk reads its own `CLERK_*` / `NEXT_PUBLIC_CLERK_*` vars
 * directly, so they are deliberately absent here — Clerk fails loudly on its
 * own if they're missing.
 */
const envsSchema = z.object({
  API_URL: z.string().url()
});

export const envs = Object.freeze(envsSchema.parse({ API_URL: process.env.API_URL }));
