import { Hono } from 'hono';
import { Webhook } from 'svix';

import { envs } from '@/shared/config/env.ts';
import { STATUS_CODES } from '@/shared/infra/http/status-code.ts';
import { logger } from '@/shared/infra/observability/logger.ts';

import { clerkEventSchema } from './schemas.ts';
import { handleUserCreated } from './user-created/use-case.ts';
import { handleUserDeleted } from './user-deleted/use-case.ts';
import { handleUserUpdated } from './user-updated/use-case.ts';

export const clerkWebhooksRoutes = new Hono();

clerkWebhooksRoutes.post('/', async (c) => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ message: 'Missing svix headers' }, STATUS_CODES.BAD_REQUEST);
  }

  const body = await c.req.text();

  let verified: unknown;
  try {
    verified = new Webhook(envs.CLERK_WEBHOOK_SECRET).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    });
  } catch (err) {
    logger.warn({ err }, 'clerk webhook signature invalid');
    return c.json({ message: 'Invalid signature' }, STATUS_CODES.UNAUTHORIZED);
  }

  const event = clerkEventSchema.safeParse(verified);
  if (!event.success) {
    return c.body(null, STATUS_CODES.NO_CONTENT);
  }

  switch (event.data.type) {
    case 'user.created':
      await handleUserCreated(event.data.data);
      break;
    case 'user.updated':
      await handleUserUpdated(event.data.data);
      break;
    case 'user.deleted':
      await handleUserDeleted(event.data.data);
      break;
  }

  return c.body(null, STATUS_CODES.NO_CONTENT);
});
