# Deployment Guide

This document covers how the app is deployed to production, what was changed to make it work, and how to push updates in the future.

---

## Architecture

```
Internet
   │
   ▼ :3000 (public)
┌─────────────────────────────────────────┐
│  Vultr VPS  139.180.154.175             │
│                                         │
│  ┌───────────────────┐                  │
│  │  frontend          │  Next.js 16     │
│  │  (wedding-app-     │  Port 3000      │
│  │   frontend-1)      │  → public       │
│  └────────┬──────────┘                  │
│           │  /api/*  /uploads/*         │
│           │  Docker internal network    │
│           ▼ :5000 (internal only)       │
│  ┌───────────────────┐                  │
│  │  backend           │  ASP.NET Core 10│
│  │  (wedding-app-     │  Port 5000      │
│  │   backend-1)       │  → internal     │
│  └────────┬──────────┘                  │
│           │                             │
│  ./data/db/wedding.db  (SQLite)         │
│  ./data/uploads/       (photo files)    │
└─────────────────────────────────────────┘
```

**Key points:**
- The frontend container is the only public entry point (port 3000)
- The frontend proxies `/api/*` and `/uploads/*` to the backend over Docker's internal network (`http://backend:5000`) — the backend port is never exposed to the internet
- The SQLite database and uploaded files live in `./data/` on the host, bind-mounted into the backend container — data survives container restarts and image rebuilds
- EF Core migrations auto-apply on backend startup; no manual migration step needed in production

---

## What Was Changed to Make It Production-Ready

The following changes were made to the codebase before deploying. Everything still works in local dev — these changes were additive, not breaking.

### 1. CORS from environment variable
**Files:** `backend/WeddingInvite.API/appsettings.json`, `appsettings.Production.json`, `Program.cs`

In dev, CORS allows `http://localhost:3000`. In production the origin comes from the `CORS_ORIGIN` env var (set in the `.env` file on the VPS and injected by Docker Compose).

```csharp
// Program.cs
var corsOrigin = builder.Configuration["CorsOrigin"] ?? "http://localhost:3000";
```

### 2. JWT secret from environment variable
**File:** `backend/WeddingInvite.API/appsettings.Production.json`

The dev config (`appsettings.json`) has a placeholder secret. In production, Docker Compose injects the real secret via `JwtSettings__SecretKey=${JWT_SECRET}`. The `.NET` double-underscore convention maps `JwtSettings__SecretKey` → `JwtSettings:SecretKey` in configuration.

### 3. SQLite database path
**File:** `backend/WeddingInvite.API/appsettings.Production.json`

- Dev: `Data Source=wedding.db` (sits next to the binary)
- Production: `Data Source=/app/data/wedding.db` (inside the container, which is bind-mounted to `./data/db/` on the host)

### 4. EF Core auto-migration on startup
**File:** `backend/WeddingInvite.API/Program.cs`

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // applies any pending migrations on startup
}
```

This means deploying a new backend image with new migrations automatically upgrades the database — no SSH commands needed.

### 5. Migration fix: Template → Templates table name
**File:** `backend/WeddingInvite.Data/Migrations/20260125000000_RenameTemplateToTemplates.cs`

The original `AddTemplates` migration created the table as `"Template"` (singular) but all subsequent migrations referenced `"Templates"` (plural). On a fresh database this caused:

```
SQLite Error 1: 'no such table: Templates'
```

A bridging migration was added between the two timestamps to rename the table:

```sql
ALTER TABLE "Template" RENAME TO "Templates";
```

### 6. .NET SDK 10.0.300 glob expansion bug
**File:** `backend/WeddingInvite.Data/WeddingInvite.Data.csproj`

.NET SDK 10.0.300 on Linux Docker fails to expand the `**/*.resx` glob when no `.resx` files exist, treating it as a literal filename and throwing `MSB3552`. Fix:

```xml
<EnableDefaultEmbeddedResourceItems>false</EnableDefaultEmbeddedResourceItems>
```

### 7. Next.js standalone output
**File:** `frontend/next.config.ts`

```js
output: 'standalone'
```

Required for the Docker multi-stage build. Produces a self-contained `server.js` that can be run with `node server.js` without the full `node_modules`.

### 8. BACKEND_URL baked in at build time
**File:** `frontend/Dockerfile`

Next.js `rewrites()` in `next.config.ts` are evaluated **at build time** in standalone mode, not at runtime. So `BACKEND_URL` must be an `ARG` passed during `docker compose build`, not just a runtime `ENV`:

```dockerfile
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build   # BACKEND_URL is now available to next.config.ts
```

Without this, the proxy target defaults to `localhost:5000` — which works on your Mac but fails inside Docker where the backend is reachable at `backend:5000` on the internal network.

### 9. Remove localhost fallbacks from frontend API calls
**Files:** `frontend/lib/api/client.ts`, `frontend/components/templates/Template*.tsx`

Changed:
```ts
// Before
?? 'http://localhost:5000'

// After
?? ''   // empty string = relative URL, routes through Next.js proxy
```

### 10. Uploads proxy
**File:** `frontend/next.config.ts`

Added a second rewrite so uploaded photos are served through the frontend:

```ts
{ source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` }
```

---

## Environment Variables (`.env` file on VPS)

The VPS needs a `.env` file at `/opt/wedding-app/.env`. Docker Compose reads it automatically.

```bash
# Copy the example and edit it
cp .env.example .env
nano .env
```

```env
# Must be at least 32 characters — used to sign JWT tokens
JWT_SECRET=replace-this-with-a-long-random-secret-at-least-32-chars

# The public URL of your app (no trailing slash)
# Use your IP for now; switch to https://yourdomain.com when you add a domain
CORS_ORIGIN=http://139.180.154.175:3000
```

> This file is gitignored and must never be committed to the repository.

---

## Initial Deployment (Fresh VPS)

Run these commands once on a new server.

```bash
# 1. SSH into the VPS
ssh root@139.180.154.175

# 2. Clone the repository
git clone https://github.com/HeiryH/wedding-invite-app.git /opt/wedding-app
cd /opt/wedding-app

# 3. Create the .env file with real secrets
cp .env.example .env
nano .env   # fill in JWT_SECRET and CORS_ORIGIN

# 4. Create data directories (DB + uploads survive image rebuilds here)
mkdir -p data/db data/uploads

# 5. Build Docker images (takes ~2 min first time)
docker compose build

# 6. Start both containers in the background
docker compose up -d

# 7. Watch the backend logs — wait for "Application started"
docker compose logs backend --tail=40 -f

# 8. Smoke test
curl http://localhost:3000/api/template   # should return JSON array of templates
```

---

## Deploying Updates

**Yes — the workflow is: push to GitHub on your Mac → SSH into VPS → git pull → rebuild → restart.**

The live app does not auto-deploy. You control exactly when updates go live.

### On your Mac

```bash
# Make your code changes, then:
git add -A
git commit -m "feat: describe what you changed"
git push origin main
```

### On the VPS

```bash
ssh root@139.180.154.175
cd /opt/wedding-app

# Pull the latest code
git pull origin main

# Rebuild only what changed
# Backend-only change (C#, migrations, models):
docker compose build backend && docker compose up -d backend

# Frontend-only change (TypeScript, pages, templates):
docker compose build frontend && docker compose up -d frontend

# Both changed (or not sure):
docker compose build && docker compose up -d

# Verify everything is healthy
docker compose ps
docker compose logs backend --tail=20
docker compose logs frontend --tail=20
```

### What happens during an update

| What changed | Rebuild | Data safe? | Downtime |
|---|---|---|---|
| Backend code | `backend` only | Yes | ~5 sec gap while container restarts |
| New EF migration | `backend` only | Yes — migration runs on startup | ~5 sec |
| Frontend code | `frontend` only | N/A | ~5 sec |
| Both | Both | Yes | ~5 sec per container |

**Your data is always safe.** The SQLite database lives at `./data/db/wedding.db` on the host — Docker Compose mounts it into the container. Rebuilding or removing the image does not touch this file.

**Migrations are automatic.** When you add a new EF migration and push it, just rebuild the backend image. The new migration runs on startup via `db.Database.Migrate()`.

---

## Useful Commands on the VPS

```bash
# See running containers
docker compose ps

# Live logs (Ctrl+C to stop)
docker compose logs -f

# Restart a single container without rebuilding
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove volumes (DANGER — deletes DB and uploads)
docker compose down -v
```

---

## Adding a Domain + HTTPS (Future)

Nginx Proxy Manager is already running on the VPS (Portainer at port 9000). When you have a domain:

1. Point your DNS A record to `139.180.154.175`
2. Open Nginx Proxy Manager UI
3. Add a Proxy Host: domain → `frontend:3000` (Docker service name)
4. Request a Let's Encrypt certificate in the SSL tab
5. Update `.env` on the VPS: `CORS_ORIGIN=https://yourdomain.com`
6. Rebuild backend: `docker compose build backend && docker compose up -d backend`

No code changes are needed — the backend reads CORS_ORIGIN from the env file.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `git pull` fails with "dubious ownership" | `git config --global --add safe.directory /opt/wedding-app` |
| `git pull` blocked by local changes | `git stash && git pull` |
| Backend logs show migration error | Check for new migrations; rebuild image |
| `Internal Server Error` on `/api/*` | Backend container may be down — `docker compose logs backend` |
| Port 3000 not accessible | `docker compose ps` to confirm frontend is running |
| Want to reset all data | `rm -f data/db/wedding.db && docker compose restart backend` |
