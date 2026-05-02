FROM node:24-alpine AS build

WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
RUN pnpm install --filter fluxroute-backend --frozen-lockfile

COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/prisma ./backend/prisma
COPY backend/src ./backend/src

RUN pnpm --filter fluxroute-backend build

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY backend/prisma ./backend/prisma
RUN pnpm install --filter fluxroute-backend --prod --frozen-lockfile
RUN pnpm --filter fluxroute-backend db:generate

COPY --from=build /app/backend/dist ./backend/dist

CMD ["sh", "-c", "pnpm --filter fluxroute-backend db:push && node backend/dist/main.js"]
