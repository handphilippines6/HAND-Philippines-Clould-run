# HAND-Philippines React SPA — Google Cloud Run
#
# Multi-stage: build the Vite client, then serve only `dist/` with the
# dependency-free Node static server (server.js) that provides the SPA
# fallback for deep links.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]
