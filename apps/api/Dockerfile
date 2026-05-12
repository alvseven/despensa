FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace + root manifests so bun can resolve the workspace graph
FROM base AS deps
COPY package.json bun.lockb ./
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app/apps/api

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 bun \
 && adduser --system --uid 1001 api

COPY --from=builder --chown=api:bun /app/apps/api/dist ./dist
COPY --from=builder --chown=api:bun /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=api:bun /app/apps/api/package.json ./package.json

USER api

EXPOSE 3333

CMD ["bun", "dist/app.js"]
