FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
RUN pnpm install --filter fluxroute-frontend --frozen-lockfile

COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY frontend/vite.config.ts ./frontend/vite.config.ts
COPY frontend/index.html ./frontend/index.html
COPY frontend/src ./frontend/src

RUN pnpm --filter fluxroute-frontend build

FROM nginx:1.27-alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
