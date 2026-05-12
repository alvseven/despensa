import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const env = config.require('env');
const domain = config.require('domain');

export const meta = {
  env,
  domain
};
