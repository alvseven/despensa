# Despensa — Working Notes for Claude

This is a living document. When patterns or decisions change, update this file before opening the PR.

## What we're building

A food expiration tracker. Users (or accounts, in the B2B case) add pantry items with buy/expiry dates; the system sends an email digest before items spoil. Started as a personal tool for the founder. Direction: dogfood B2C with friends first, then expand to B2B (restaurants, small grocers).

## Repo layout

```
apps/
  api/   → backend (Hono + Drizzle + Postgres)  — api.despensa.com
  app/   → product webapp (Next.js)             — app.despensa.com
  www/   → marketing site (Next.js)             — despensa.com
infra/   → Pulumi (backend infra only)
packages/ (empty for now — will hold shared TS code if needed)
```

Frontends deploy via Vercel (config in `apps/<name>/vercel.json` when needed). Backend infra is managed by Pulumi in `/infra`.

## Stack (current and pending)

| Layer            | Choice                                | Status                     |
| ---------------- | ------------------------------------- | -------------------------- |
| Runtime / pkg    | Bun 1.1+                              | done                       |
| Monorepo         | Bun workspaces + Turborepo            | done                       |
| HTTP framework   | Hono                                  | done                       |
| ORM              | Drizzle + node-postgres               | done                       |
| Database         | Postgres 17                           | done (local docker)        |
| Auth             | Clerk (passwordless: Google + email)  | done                       |
| Webhooks         | svix (Clerk webhook signature verify) | done                       |
| Validation       | Zod                                   | done                       |
| Lint + format    | Biome                                 | done (single tool, no oxlint/prettier) |
| Date handling    | date-fns + @date-fns/tz                | done (Temporal swap deferred) |
| Background jobs  | Trigger.dev v3                         | done                       |
| Notifications    | Email via Resend (digest)              | done                       |
| Logs             | pino (pino-pretty in dev, JSON in prod) | done                      |
| Errors           | Hono `app.onError` → pino + `Sentry.captureException` | done       |
| Request tracing  | `x-request-id` middleware              | done                       |
| Testing          | bun:test + testcontainers Postgres     | infra done (needs Docker)  |
| Hosting (API)    | TBD (Fly.io / Railway / AWS App Runner) | **pending**              |
| Hosting (DB)     | TBD (Neon recommended)                 | **pending**                |
| IaC              | Pulumi (TypeScript)                    | scaffold only              |

## Backend code patterns

### Module layout

Each resource is a module under `apps/api/src/modules/<resource>/`. Each *action* (endpoint) is a folder:

```
modules/products/
  routes.ts                          # Hono routes for the resource
  create-products/
    schemas.ts                       # Zod request schema + inferred type
    use-case.ts                      # Business logic, calls repos
  get-products/
    schemas.ts
    use-case.ts
  ...
```

`schemas.ts` exports a Zod schema named `<action>RequestSchema` and an inferred TypeScript type named `<Action>Input`.

`use-case.ts` exports an async function named `<action>` that takes the inferred input and returns either `[error, null]` or `[null, response]`.

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

### Auth (Clerk)

- The frontend obtains a Clerk session token. It sends `Authorization: Bearer <clerk-jwt>` on each request.
- `requireAuth` middleware (`apps/api/src/modules/auth/middlewares/require-auth.ts`) verifies the token via `@clerk/backend`'s `verifyToken`, looks up our user by `clerk_id`, resolves their default account (first membership), and sets `c.set('auth', { clerkId, userId, accountId, email })`.
- Protected routes read `c.get('auth').accountId` and scope queries by it. Never trust IDs from the request body for ownership — they must come from the verified `auth` context.
- User provisioning happens via Clerk webhook at `POST /webhooks/clerk`. On `user.created`, we transactionally create our `users` row + a `personal` account + an `owner` membership. On `user.updated` we sync denormalized fields (name/email/avatar). On `user.deleted` we soft-delete.
- Webhook signature verification uses `svix`. The `CLERK_WEBHOOK_SECRET` env var must match the secret in the Clerk dashboard webhook settings.

### Accounts / memberships model

Every resource (products, notifications) hangs off `account_id`, not `user_id`. Personal users have a one-user account auto-created on signup. Org accounts (B2B) will have multiple users with roles (`owner` / `admin` / `member`).

Owner is set when the account is created. Admin/member roles are reserved for future B2B work; the API doesn't differentiate them yet.

### Schemas + naming

- File and folder names: kebab-case (`get-product/`, `create-products/`).
- Exports: camelCase functions, PascalCase types.
- Use the `@/` path alias for imports from `apps/api/src/`.
- Imports use `.ts` extensions (Bun resolves them; Drizzle migrations need them too).

## Adding a new endpoint

1. Create `apps/api/src/modules/<resource>/<action>/schemas.ts`:
   - Export a Zod schema `<action>RequestSchema`
   - Export an inferred type `<Action>Input`
2. Create `apps/api/src/modules/<resource>/<action>/use-case.ts`:
   - Async function takes the input, returns the success/error tuple
   - Use `usersRepository()`, `productsRepository()`, etc.
   - For multi-step writes, wrap in `db.transaction`
3. Wire it in `apps/api/src/modules/<resource>/routes.ts`:
   - Apply `requireAuth` (or `productsRoutes.use(requireAuth)` at the top for all routes)
   - Read `accountId` (or `userId`) from `c.get('auth')`
   - Call `validateSchema(...)` then the use case
   - Return `c.json(response.data, response.code)`

## Database migrations

```bash
# inside apps/api/
bun db:generate <migration-name>   # writes drizzle/<timestamp>_<name>.sql
# review, manually add backfill DML if needed
bun db:migrate                      # applies pending migrations
bun db:studio                       # browse data
```

Migrations live in `apps/api/drizzle/`. Each migration has a `.sql` file plus a `<timestamp>_snapshot.json` in `meta/`, all tracked in `meta/_journal.json`. When writing migrations by hand (e.g., adding a backfill), keep snapshots in sync — or run `bun db:generate` after the manual file and let it produce a no-op snapshot.

## Commands (root)

```bash
bun install                      # install all workspaces
bun dev                          # run all apps via turbo
bun --filter @despensa/api dev   # backend only
bun --filter @despensa/app dev   # webapp only
bun --filter @despensa/www dev   # marketing only
bun run lint                     # biome across the repo
bun run lint:fix                 # biome --write --unsafe
```

Per-app: `bun run build`, `bun run types`, `bun run db:generate`, `bun run db:migrate`.

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

- **Biome over oxlint + Prettier**: Biome does linting + formatting in one Rust binary. oxlint is linter-only; using it means re-adding Prettier. No net win.
- **Email-first notifications**: Resend already in the stack, free up to 3k/month, plenty for dogfooding. SMS/WhatsApp deferred until paying customer demands it. Twilio is expensive; Brazilian providers like Z-API use unofficial APIs and can ban the number.
- **Clerk over self-hosted auth**: Auth is solved; we're not in the auth business. Free up to 10k MAUs covers years of dogfooding.
- **Pulumi for backend infra only**: Frontends deploy via Vercel (UI/config-only). Pulumi `/infra` is scaffolded; provider choices (AWS App Runner vs Fly vs Render) pending.
- **Trigger.dev over keeping Lambdas**: Lambda + SQS + SNS + custom zip build was too much glue for one daily cron. Trigger.dev is one file per task with built-in retries and observability. Lambdas already deleted from the repo; replacement pending.
- **Accounts + memberships model from day one**: Even while only B2C, products hang off `account_id`, not `user_id`. Lets us add B2B orgs later without a painful migration.

## Background jobs (Trigger.dev)

Tasks live in `apps/api/trigger/`. Config in `apps/api/trigger.config.ts`.

- **`process-pending-notifications`** — scheduled daily (`0 9 * * *`). Loads `status='created'` notifications whose `notify_at=today`, groups by account, triggers one `send-account-digest` child per account, marks each as `scheduled`.
- **`send-account-digest`** — accepts `{ accountId, notificationIds[] }`, fetches the account owner + products, builds a single HTML email via `sendExpirationDigest`, sends through Resend, marks notifications `sent` or `failed`. Retries up to 3× with exponential backoff.

Local dev: `bun --filter @despensa/api trigger:dev` (needs `TRIGGER_PROJECT_REF` + `TRIGGER_ACCESS_TOKEN` from the Trigger.dev dashboard).

Deploy: `bun --filter @despensa/api trigger:deploy`.

## Testing

Tests use `bun test` with `@testcontainers/postgresql` to spin up a real Postgres for each `bun test` invocation.

- `apps/api/bunfig.toml` preloads `apps/api/test/setup.ts`.
- `setup.ts` starts a container, sets env vars, runs Drizzle migrations, and mocks `@clerk/backend.verifyToken` so tests authenticate by sending `Authorization: Bearer test_<clerkId>`.
- `test/factories.ts` exposes `createTestUser({ name?, email? })` which transactionally creates a user + personal account + owner membership and returns `{ user, account, token }`.
- Each test file uses `beforeEach(() => resetDb())` to truncate all tables.
- Tests hit the actual `app` via `app.request(path, init)` — no separate HTTP server needed (Hono's `app.request` is the standard pattern).

Run: `bun --filter @despensa/api test`. Requires Docker running locally.

## Pending

1. **Hosting decisions** — pick API host (Fly.io vs Railway vs AWS App Runner) + DB host (Neon strongly recommended). Once chosen, wire up `/infra` Pulumi resources.
2. **Temporal API** — replace date-fns. Deferred indefinitely; no urgency since current date handling works.

## Known gotchas

- Bun loads `.env` automatically for both scripts and child processes (drizzle-kit, etc). No `dotenv` import needed.
- Hono's `verify` from `hono/jwt` requires the algorithm as a third argument now — but we don't use it anymore (Clerk handles JWT verification).
- The `users` table is **denormalized** with Clerk-managed fields (email, name, avatarUrl). They're kept in sync via the `user.updated` webhook. Treat Clerk as the source of truth; our DB is the lookup index.
- Schema starts from a single init migration (`20260511000000_init.sql`). Pre-monorepo migration history was squashed since nothing was in production yet — `bun --filter @despensa/api db:migrate` against a fresh database creates the whole schema in one shot.
