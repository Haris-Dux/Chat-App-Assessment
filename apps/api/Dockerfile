FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @concierge/api...
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @concierge/contracts build \
  && pnpm --filter @concierge/api build \
  && pnpm --filter @concierge/api deploy --prod /app

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app .
USER node
EXPOSE 3000
CMD ["sh", "-c", "node dist/database/tasks.js migrate && node dist/main.js"]
