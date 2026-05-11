import pino from 'pino';

import { envs } from '@/shared/config/env.ts';

const isProd = envs.NODE_ENV === 'production';

export const logger = pino({
  level: envs.LOG_LEVEL,
  base: { service: 'despensa-api' },
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname,service'
        }
      }
});
