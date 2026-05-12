/**
 * Test preload — runs once per `bun test` invocation, before any test file loads.
 *
 * Spins up a Postgres testcontainer, runs migrations against it, sets the
 * env vars our app expects, and installs a stub for @clerk/backend so tests
 * can authenticate as any user by sending `Authorization: Bearer test_<clerkId>`.
 *
 * Each test file gets a clean DB via the `resetDb()` helper exported here.
 */

import { afterAll, mock } from 'bun:test';
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

// Ryuk (testcontainers' cleanup sidecar) waits for a /.*Started.*/ log
// message that podman's log streaming truncates before, and that ephemeral
// CI runners can't reattach to anyway. Disabling it lets the actual postgres
// container start. Leaked containers aren't a real concern here — each test
// run is its own process and uses fresh resources.
process.env.TESTCONTAINERS_RYUK_DISABLED ??= 'true';

let container: StartedPostgreSqlContainer | null = null;
let pool: Pool | null = null;

export async function setupTestDatabase() {
  if (container) return;
  const log = (msg: string) => process.stderr.write(`[test-setup] ${msg}\n`);

  log('starting postgres testcontainer (this can take ~30s on first run while podman pulls the image)');
  container = await new PostgreSqlContainer('postgres:17').start();
  log(`container ready at ${container.getHost()}:${container.getPort()}`);

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  process.env.DRIZZLE_KIT_DATABASE_URL = url;

  pool = new Pool({ connectionString: url });
  const migrationDb = drizzle(pool);

  log('running migrations');
  await migrate(migrationDb, { migrationsFolder: './drizzle' });
  log('ready');
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

try {
  await setupTestDatabase();
} catch (err) {
  console.error('test database setup failed:', err);
  process.exit(1);
}

afterAll(async () => {
  await teardownTestDatabase();
});
