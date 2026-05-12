/**
 * Test preload — runs once per `bun test` invocation, before any test file loads.
 *
 * Connects to a dedicated test Postgres (port 5433 by default; see
 * `apps/api/compose.yaml`'s `test-database` service), runs Drizzle migrations
 * against it, and installs a stub for @clerk/backend so tests can authenticate
 * as any user by sending `Authorization: Bearer test_<clerkId>`.
 *
 * Each test file gets a clean DB via the `resetDb()` helper exported here.
 */

import { afterAll, mock } from 'bun:test';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/despensa_test';

mock.module('@clerk/backend', () => ({
  verifyToken: async (token: string) => {
    if (!token.startsWith('test_')) {
      throw new Error('Invalid test token');
    }
    return { sub: token.slice('test_'.length) };
  }
}));

process.env.NODE_ENV ??= 'test';
process.env.API_PORT ??= '0';
process.env.LOG_LEVEL ??= 'silent';
process.env.CLERK_SECRET_KEY ??= 'test_clerk_secret';
process.env.CLERK_WEBHOOK_SECRET ??= 'test_webhook_secret';
process.env.RESEND_API_KEY ??= 'test_resend_key';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DRIZZLE_KIT_DATABASE_URL = TEST_DATABASE_URL;

let pool: Pool | null = null;

export async function setupTestDatabase() {
  if (pool) return;
  const log = (msg: string) => process.stderr.write(`[test-setup] ${msg}\n`);
  const redacted = TEST_DATABASE_URL.replace(/:\/\/[^@]+@/, '://***@');

  log(`connecting to ${redacted}`);
  pool = new Pool({ connectionString: TEST_DATABASE_URL, connectionTimeoutMillis: 2000 });
  await waitForPostgres(pool);

  log('running migrations');
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  log('ready');
}

async function waitForPostgres(p: Pool, deadlineMs = 15_000, intervalMs = 250) {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < deadlineMs) {
    try {
      await p.query('SELECT 1');
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(`postgres not ready after ${deadlineMs}ms: ${String(lastErr)}`);
}

export async function teardownTestDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function resetDb() {
  if (!pool) {
    throw new Error('Test DB not set up — call setupTestDatabase first');
  }
  await pool.query(
    'TRUNCATE "users", "accounts", "memberships", "products", "notifications" RESTART IDENTITY CASCADE'
  );
}

try {
  await setupTestDatabase();
} catch (err) {
  console.error('test database setup failed.');
  console.error('locally: start the test DB with `podman-compose up -d test-database`');
  console.error('         (or `docker compose up -d test-database`).');
  console.error(err);
  process.exit(1);
}

afterAll(async () => {
  await teardownTestDatabase();
});
