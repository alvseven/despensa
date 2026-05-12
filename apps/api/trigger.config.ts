import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? '',
  runtime: 'bun',
  logLevel: 'log',
  maxDuration: 300,
  dirs: ['./src/trigger'],
  build: {
    external: ['pg', 'drizzle-orm']
  }
});
