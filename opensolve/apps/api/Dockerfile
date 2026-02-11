FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN cd apps/api && npm install
RUN cd packages/shared && npm install

FROM base AS build
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
RUN cd packages/shared && npx tsc
COPY apps/api ./apps/api
RUN cd apps/api && npx tsc

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/api
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/packages/shared ./../../packages/shared
COPY apps/api/package.json ./
EXPOSE 4000
CMD ["node", "dist/server.js"]
