# Despensa

Track your pantry. Get notified before things expire.

## Repo layout

```
apps/
  api/   -> backend (Hono + Drizzle + Postgres) — api.despensa.ai
  app/   -> product webapp (Next.js)            — app.despensa.ai
  www/   -> marketing site (Next.js)            — despensa.ai
packages/
  (shared code — empty for now)
```

## Requirements

- [Bun](https://bun.sh) 1.1+
- Docker (for local Postgres)

## Setup

```bash
bun install

cp apps/api/.env.example apps/api/.env         # then fill in values
cp apps/app/.env.example apps/app/.env.local   # then fill in values

docker compose -f apps/api/compose.yaml up -d database   # local Postgres
bun --filter @despensa/api db:migrate

bun dev   # runs all apps via turborepo
```

Both `.env` files must point at the **same** Clerk instance — the webapp mints
session tokens the API has to be able to verify.

For the webapp to see your user, Clerk's `user.created` webhook has to reach the
API, which provisions the `users` row + personal account. Locally that means
exposing `http://localhost:3333/webhooks/clerk` (Clerk's dashboard can tunnel, or
use ngrok) and setting `CLERK_WEBHOOK_SECRET` to match. Without it, every
authenticated request 401s with `User not provisioned or has no account`.

## Per-app dev

```bash
bun --filter @despensa/api dev   # backend on :3333
bun --filter @despensa/app dev   # webapp  on :3000
bun --filter @despensa/www dev   # marketing on :3001
```
