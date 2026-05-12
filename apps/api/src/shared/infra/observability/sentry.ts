import * as Sentry from '@sentry/node';

import { envs } from '@/shared/config/env.ts';

if (envs.SENTRY_DSN) {
  Sentry.init({
    dsn: envs.SENTRY_DSN,
    environment: envs.NODE_ENV,
    tracesSampleRate: envs.NODE_ENV === 'production' ? 0.1 : 1.0
  });
}

export { Sentry };
