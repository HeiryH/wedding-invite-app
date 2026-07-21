FROM node:22-alpine AS builder
WORKDIR /app

# BACKEND_URL is read at build time by next.config.ts for rewrite targets
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_URL=$BACKEND_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Debian-slim, not alpine — Playwright's downloaded Chromium is a glibc build and won't run
# on musl-based Alpine at all. Only the runner needs this; the builder never launches a browser.
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Chromium for the super-admin screenshot tool (app/api/super-admin/screenshot). Two gotchas
# forced the two steps below:
# 1. Next's standalone output tracing only preserves files reachable via the route's static
#    `import('playwright')` — it copies a correctly-versioned "playwright" package directory,
#    but strips non-imported files including cli.js. `npm install` here completes it.
# 2. This image also carries the devDep "@playwright/test", and both it and "playwright" declare
#    a `playwright` bin, so node_modules/.bin/playwright resolves to whichever got hoisted last —
#    NOT necessarily the exact version the route actually `require`s. Installing/running via the
#    wrong package's CLI downloads a browser revision that doesn't match, and the route then
#    fails at runtime with "Executable doesn't exist". Invoking cli.js by its full path (not
#    `npx playwright`) guarantees we use the SAME package copy in both steps.
RUN npm install playwright@1.60.0 --no-save \
 && node node_modules/playwright/cli.js install --with-deps chromium \
 && rm -rf /var/lib/apt/lists/*

EXPOSE 3000
CMD ["node", "server.js"]
