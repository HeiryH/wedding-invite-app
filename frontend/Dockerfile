FROM node:22-alpine AS builder
WORKDIR /app

# BACKEND_URL is read at build time by next.config.ts for rewrite targets
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_URL=$BACKEND_URL

COPY package*.json ./
RUN npm ci

COPY . .
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
