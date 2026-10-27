# HAND-Philippines React SPA — Google Cloud Run
#
# Multi-stage: build the Vite client, then serve `dist/` + the /_functions API
# with server.js. The runtime stage installs production dependencies only
# (@google-cloud/firestore) and copies the seed data the API reads on boot.
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
# Runtime dependencies (Firestore SDK) — the API is no longer dependency-free.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/data ./src/data
COPY server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]
