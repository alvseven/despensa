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
cp apps/api/.env.example apps/api/.env   # then fill in values
docker compose up -d database              # local Postgres
bun --filter @despensa/api db:migrate
bun dev                                    # runs all apps via turborepo
```

## Per-app dev

```bash
bun --filter @despensa/api dev   # backend on :3333
bun --filter @despensa/app dev   # webapp  on :3000
bun --filter @despensa/www dev   # marketing on :3001
```
