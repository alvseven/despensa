import { SQSClient } from '@aws-sdk/client-sqs';

import { envs } from '@/shared/config/env.ts';

export const sqsClient = new SQSClient({
  region: envs.AWS_SQS_REGION,
  credentials: {
    accessKeyId: envs.AWS_SQS_ACCESS_KEY_ID,
    secretAccessKey: envs.AWS_SQS_SECRET_ACCESS_KEY
  }
});
