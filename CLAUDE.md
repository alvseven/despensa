# Despensa — Working Notes for Claude

This is a living document. When patterns or decisions change, update this file before opening the PR.

## What we're building

A food expiration tracker. Users (or accounts, in the B2B case) add pantry items with buy/expiry dates; the system sends an email digest before items spoil. Started as a personal tool for the founder. Direction: dogfood B2C with friends first, then expand to B2B (restaurants, small grocers).

## Repo layout

```
apps/
  api/   → backend (Hono + Drizzle + Postgres)  — api.despensa.ai
  app/   → product webapp (Next.js)             — app.despensa.ai
  www/   → marketing site (Next.js)             — despensa.ai
infra/   → Pulumi (backend infra only)
packages/ (empty for now — will hold shared TS code if needed)
```

Frontends deploy via Vercel (config in `apps/<name>/vercel.json` when needed). Backend infra is managed by Pulumi in `/infra`.

## Stack

| Layer            | Choice                                                |
| ---------------- | ----------------------------------------------------- |
| Runtime / pkg    | Bun 1.1+                                              |
| Monorepo         | Bun workspaces + Turborepo                            |
| HTTP framework   | Hono                                                  |
| ORM              | Drizzle + node-postgres                               |
| Database         | Postgres 17                                           |
| Auth             | Clerk (passwordless: Google + email)                  |
| Webhooks         | svix (Clerk webhook signature verify)                 |
| Validation       | Zod                                                   |
| Lint + format    | Biome                                                 |
| Date handling    | date-fns + @date-fns/tz                               |
| Background jobs  | Trigger.dev v3                                        |
| Notifications    | Email via Resend (digest)                             |
| Logs             | pino (pino-pretty in dev, JSON in prod)               |
| Errors           | Hono `app.onError` → pino + `Sentry.captureException` |
| Request tracing  | `x-request-id` middleware                             |
| Testing          | bun:test + testcontainers Postgres                    |
| Hosting (API)    | TBD                                                   |
| Hosting (DB)     | TBD                                                   |
| IaC              | Pulumi (TypeScript)                                   |

## Backend code patterns

### Module layout

Each resource is a module under `apps/api/src/modules/<resource>/`. Each *action* (endpoint or background handler) is a folder:

```
modules/products/
  routes.ts                          # Hono routes for the resource
  create-products/
    schemas.ts                       # Zod request schema + inferred type
    use-case.ts                      # Business logic, calls repos
    use-case.test.ts                 # E2E tests for this action
  get-products/
    schemas.ts
    use-case.ts
    use-case.test.ts
  ...
```

`schemas.ts` exports a Zod schema named `<action>RequestSchema` and an inferred TypeScript type named `<Action>Input`. Use cases take that inferred type, **never** an ad-hoc `type Input = { ... }`.

`use-case.ts` exports an async function named `<action>` that takes the inferred input and returns either `[error, null]` or `[null, response]` (the tuple convention below).

### The tuple-return convention

Use cases return a tuple:

```ts
// success
return successResponse(data, STATUS_CODES.OK);   // → [null, { code, data }]

// error
return errorResponse('Not found', STATUS_CODES.NOT_FOUND);  // → [{ code, message }, null]
```

Routes destructure and branch:

```ts
const [error, response] = await getProduct(parsed.data);
if (error) return c.json({ message: error.message }, error.code);
return c.json(response.data, response.code);
```

**Why tuples instead of throwing?** Forces every error case into a typed surface. No silent unhandled rejections, no untyped catches. Trade-off: noisier than throwing. We keep this pattern for *expected* errors (validation, not-found, conflict). *Unexpected* errors (DB down, bug) bubble up and hit `app.onError` (`apps/api/src/shared/infra/http/error-handler.ts`), which:

- Translates `AppError` → its declared status code (use `AppError` from `@/shared/infra/http/app-error.ts` when a tuple return is awkward).
- Translates `ZodError` → 400 with `fieldErrors`.
- Translates Postgres constraint violations (codes 23505/23503/23502) → 409/400/400.
- Anything else → 500 + `Sentry.captureException` + structured error log.

Every error response carries the `requestId` so the client can correlate with logs.

### Idempotent DELETE

DELETE is always 204. Don't check whether the row exists first — `DELETE WHERE id = ? AND account_id = ?` is a no-op if it doesn't match. The repo handles ownership scoping; the route returns 204 unconditionally.

### Repositories

`apps/api/src/shared/database/repositories/<resource>.ts` exports a factory that takes an optional transaction:

```ts
export const productsRepository = (tx: Tx = db) => {
  const createProduct = async (...) => { ... };
  return { createProduct, ... };
};
```

To run multiple repo calls in one transaction, pass `tx` into each factory:

```ts
await db.transaction(async (tx) => {
  const { createUser } = usersRepository(tx);
  const { createAccount } = accountsRepository(tx);
  const { createMembership } = membershipsRepository(tx);
  // ... all writes share the same tx
});
```

Repo functions never throw business errors — they return `undefined` for "not found" cases. Use cases convert that to `errorResponse(...)`. Unexpected DB errors propagate up.

**Bulk operations**: prefer `createMany`, `markManyAs*` over for-loops. Drizzle's `insert(...).values(array)` and `inArray(column, ids)` are the right tools — never iterate one-by-one.

### Auth (Clerk)

- The frontend obtains a Clerk session token. It sends `Authorization: Bearer <clerk-jwt>` on each request.
- `requireAuth` middleware (`apps/api/src/modules/auth/middlewares/require-auth.ts`) verifies the token via `@clerk/backend`'s `verifyToken`, looks up our user by `clerk_id`, resolves their default account (first membership), and sets `c.set('auth', { clerkId, userId, accountId, email })`. The middleware also owns the `AuthContext` and `AppVariables` types — colocate types with the code that produces/consumes them; don't make a separate `types.ts`.
- Protected routes read `c.get('auth').accountId` and scope queries by it. Never trust IDs from the request body for ownership — they must come from the verified `auth` context.
- User provisioning happens via Clerk webhook at `POST /webhooks/clerk`. On `user.created`, we transactionally create our `users` row + a `personal` account + an `owner` membership. On `user.updated` we sync denormalized fields (name/email/avatar). On `user.deleted` we soft-delete.
- Webhook signature verification uses `svix`. The `CLERK_WEBHOOK_SECRET` env var must match the secret in the Clerk dashboard webhook settings.

### Webhooks module

`apps/api/src/modules/webhooks/<provider>/` follows the same per-action layout as everything else:

```
webhooks/clerk/
  routes.ts              # signature verify + dispatch
  schemas.ts             # event Zod schemas + small helpers shared by handlers
  user-created/use-case.ts
  user-updated/use-case.ts
  user-deleted/use-case.ts
```

### Accounts / memberships model

Every resource (products, notifications) hangs off `account_id`, not `user_id`. Personal users have a one-user account auto-created on signup. Org accounts (B2B) will have multiple users with roles (`owner` / `admin` / `member`).

Owner is set when the account is created. Admin/member roles are reserved for future B2B work; the API doesn't differentiate them yet.

### Schemas + naming

- File and folder names: kebab-case (`get-product/`, `create-products/`).
- Exports: camelCase functions, PascalCase types.
- Use the `@/` path alias for imports from `apps/api/src/`.
- Imports use `.ts` extensions (Bun resolves them; Drizzle migrations need them too).
- **No type-only files.** Colocate types next to the code that owns them. A `*.types.ts` file is a smell.

## Adding a new endpoint

1. Create `apps/api/src/modules/<resource>/<action>/schemas.ts`:
   - Export a Zod schema `<action>RequestSchema`
   - Export an inferred type `<Action>Input`
2. Create `apps/api/src/modules/<resource>/<action>/use-case.ts`:
   - Function signature takes the inferred Zod type — never an ad-hoc inline type
   - Use `usersRepository()`, `productsRepository()`, etc.
   - For multi-step writes, wrap in `db.transaction`
3. Wire it in `apps/api/src/modules/<resource>/routes.ts`:
   - Apply `requireAuth` (or `productsRoutes.use(requireAuth)` at the top for all routes)
   - Read `accountId` (or `userId`) from `c.get('auth')`
   - Call `validateSchema(...)` then the use case
   - Return `c.json(response.data, response.code)`
4. Add a `use-case.test.ts` next to the use case.

## Background jobs (Trigger.dev)

Tasks live in `apps/api/src/trigger/`. Config in `apps/api/trigger.config.ts` (`dirs: ['./src/trigger']`).

- **`process-pending-notifications`** — scheduled daily (`0 9 * * *`). Loads `status='created'` notifications whose `notify_at=today`, groups by account, triggers one `send-account-digest` child per account, marks each as `scheduled`.
- **`send-account-digest`** — accepts `{ accountId, notificationIds[] }`, parses with the use case's Zod schema, delegates to `sendExpirationDigest`. Retries up to 3× with exponential backoff.

Triggers are entry points (like HTTP routes are), not shared utilities — that's why they live at `src/trigger/`, not under `shared/`. They orchestrate; the actual business logic always lives in a `modules/<resource>/<action>/use-case.ts`.

Local dev: `bun --filter @despensa/api trigger:dev` (needs `TRIGGER_PROJECT_REF` + `TRIGGER_ACCESS_TOKEN` from the Trigger.dev dashboard).

Deploy: `bun --filter @despensa/api trigger:deploy`.

## Testing

Tests use `bun test` with `@testcontainers/postgresql`.

- `apps/api/bunfig.toml` preloads `apps/api/src/shared/tests/setup.ts`.
- `src/shared/tests/setup.ts` starts a container, sets env vars, runs Drizzle migrations, and mocks `@clerk/backend.verifyToken` so tests authenticate by sending `Authorization: Bearer test_<clerkId>`.
- `src/shared/tests/factories.ts` exposes `createTestUser({ name?, email? })` which transactionally creates a user + personal account + owner membership and returns `{ user, account, token }`.
- Tests live next to the code they cover: `use-case.test.ts` sits next to `use-case.ts`. Anything that can't be colocated (cross-cutting auth flow, etc.) goes under `src/shared/tests/`.
- Each test file uses `beforeEach(() => resetDb())` to truncate all tables.
- Tests hit the actual `app` via `app.request(path, init)` — no separate HTTP server needed.

Run: `bun --filter @despensa/api test`. Requires Docker (or Podman) running locally.

With Podman on macOS, export these once (e.g. in `~/.zshrc`) so testcontainers can find the socket:

```bash
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
export TESTCONTAINERS_RYUK_DISABLED=true
```

## Database migrations

```bash
# inside apps/api/
bun db:generate <migration-name>   # writes drizzle/<timestamp>_<name>.sql
# review, manually add backfill DML if needed
bun db:migrate                      # applies pending migrations
bun db:studio                       # browse data
```

Schema starts from `20260511000000_init.sql`. Pre-monorepo history was squashed since nothing was in production.

## Commands (root)

```bash
bun install                      # install all workspaces
bun dev                          # run all apps via turbo
bun --filter @despensa/api dev   # backend only
bun --filter @despensa/app dev   # webapp only
bun --filter @despensa/www dev   # marketing only
bun run lint                     # biome across the repo
bun run lint:fix                 # biome --write --unsafe
bun run types:check              # tsc --noEmit across workspaces
bun run test                     # bun:test across workspaces (needs Docker)
```

## Pull request convention

Treat PR titles and descriptions like a senior engineer reviewing for a Staff+ team would.

**Title**: short, imperative, < 70 chars. Describe the change, not the area. Good: `Fix expired-code check inverted in verify-email`. Bad: `auth fixes` / `Update verify-email/use-case.ts`.

**Body**: three sections, no fluff.

```markdown
## Summary
1–3 bullet points. What this PR does and why. Reference the user-visible
or system-visible behavior change, not the file paths.

## Implementation notes
Anything non-obvious about *how* this was done — trade-offs considered,
alternatives rejected, follow-ups deferred. Skip if it's a trivial change.

## Test plan
- [ ] Concrete steps to verify the change works
- [ ] Edge cases checked
- [ ] Migration applied / rolled back successfully (if schema change)
```

Rules:
- No emoji in titles. No emoji in body unless it's a checkbox.
- One concern per PR. If you find yourself writing "and also fixes X" in the summary, X belongs in a different PR.
- Link issues with `Fixes #N` or `Refs #N`.
- Schema changes always include the migration file in the same PR as the code that depends on it.
- Don't rubber-stamp "looks good" — a PR description that doesn't explain *why* is a red flag for the reviewer.

## Commits

Same spirit: short imperative subject (< 60 chars), optional body. Squash-merge PRs so the commit message inherits the PR title + body.

## Decisions made (so they don't get re-litigated)

- **Biome**: linting + formatting in one Rust binary. Replaces ESLint + Prettier or oxlint + Prettier.
- **Email-first notifications**: Resend, free tier covers dogfooding. SMS/WhatsApp deferred until a paying customer demands it.
- **Clerk over self-hosted auth**: auth is solved; we're not in the auth business.
- **Pulumi for backend infra only**: frontends deploy via Vercel.
- **Trigger.dev over Lambdas**: one file per task with built-in retries, scheduling, observability.
- **Accounts + memberships from day one**: even while B2C, resources hang off `account_id`, not `user_id`.

## Known gotchas

- Bun loads `.env` automatically for both scripts and child processes (drizzle-kit, etc). No `dotenv` import needed.
- The `users` table is **denormalized** with Clerk-managed fields (email, name, avatarUrl). They're kept in sync via the `user.updated` webhook. Treat Clerk as the source of truth; our DB is the lookup index.
