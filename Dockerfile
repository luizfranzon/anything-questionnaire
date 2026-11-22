FROM node:24-slim AS build
RUN npm install -g pnpm@12.3.4
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/ui/package.json packages/ui/
COPY packages/app/package.json packages/app/
RUN pnpm install --frozen-lockfile
COPY packages packages
RUN pnpm --filter @anything-questionnaire/app build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    MIGRATIONS_DIR=/app/drizzle
COPY --from=build /app/packages/app/.output ./.output
COPY --from=build /app/packages/engine/drizzle ./drizzle
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
