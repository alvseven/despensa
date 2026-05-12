/**
 * Test preload — runs once per `bun test` invocation, before any test file loads.
 *
 * Spins up a Postgres testcontainer, runs migrations against it, sets the
 * env vars our app expects, and installs a stub for @clerk/backend so tests
 * can authenticate as any user by sending `Authorization: Bearer test_<clerkId>`.
 *
 * Each test file gets a clean DB via the `resetDb()` helper exported here.
 */

import { mock } from 'bun:test';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

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

let container: StartedPostgreSqlContainer | null = null;
let pool: Pool | null = null;

export async function setupTestDatabase() {
  if (container) return;
  container = await new PostgreSqlContainer('postgres:17').start();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  process.env.DRIZZLE_KIT_DATABASE_URL = url;

  pool = new Pool({ connectionString: url });
  const migrationDb = drizzle(pool);
  await migrate(migrationDb, { migrationsFolder: './drizzle' });
}

export async function teardownTestDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (container) {
    await container.stop();
    container = null;
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

await setupTestDatabase();
