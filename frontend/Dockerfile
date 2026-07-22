FROM node:22-alpine AS builder
WORKDIR /app

# BACKEND_URL is read at build time by next.config.ts for rewrite targets
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_URL=$BACKEND_URL

COPY package*.json ./
RUN npm ci

COPY . .
# The deploy VPS is a 1-CPU/955MB box — Turbopack's build worker hits its default V8 heap
# ceiling there well before physical RAM is exhausted (ERR_WORKER_OUT_OF_MEMORY). There's a
# 3GB swapfile already configured on that host with room to spare, so raise the ceiling rather
# than shrink the app; the build is a one-time cost, not something serving live traffic.
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
