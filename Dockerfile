FROM node:22-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS prod-deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

RUN mkdir dist
RUN chown api:nodejs dist
RUN chown api:nodejs .

COPY --chown=api:nodejs package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/dist ./

USER api

EXPOSE 3333

