FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @concierge/web...
COPY packages/contracts packages/contracts
COPY apps/web apps/web
RUN pnpm --filter @concierge/contracts build && pnpm --filter @concierge/web build

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
