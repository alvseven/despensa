import { SNSClient } from '@aws-sdk/client-sns';

import { envs } from '@/shared/config/env.ts';

export const snsClient = new SNSClient({
  region: envs.AWS_SNS_REGION,
  credentials: {
    accessKeyId: envs.AWS_SNS_ACCESS_KEY_ID,
    secretAccessKey: envs.AWS_SNS_SECRET_ACCESS_KEY
  }
});
