# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
# Run the API (from repo root)
dotnet run --project backend/WeddingInvite.API

# Add a migration
dotnet ef migrations add <MigrationName> --project backend/WeddingInvite.Data --startup-project backend/WeddingInvite.API

# Apply migrations
dotnet ef database update --project backend/WeddingInvite.Data --startup-project backend/WeddingInvite.API
```

### Frontend
```bash
# From frontend/
npm run dev     # Dev server on :3000
npm run build   # Production build
npm run lint    # ESLint
```

## Architecture

### Monorepo Layout
- `backend/` — ASP.NET Core 10 solution (`WeddingInvite.slnx`)
  - `WeddingInvite.Models` — EF entity classes only
  - `WeddingInvite.Data` — `AppDbContext`, repositories, migrations
  - `WeddingInvite.Core` — DTOs, service interfaces + implementations
  - `WeddingInvite.API` — controllers, DI wiring (`Program.cs`), static file serving
- `frontend/` — Next.js 16 (App Router, TypeScript)

### Backend Pattern: Repository → Service → Controller
All repos/services are registered as **scoped** in `Program.cs`. When adding new functionality:
1. Add interface + implementation to `WeddingInvite.Data/Repositories/`
2. Add interface + implementation to `WeddingInvite.Core/Services/`
3. Register both in `Program.cs`
4. Add controller to `WeddingInvite.API/Controllers/`

### Auth
- JWT tokens stored in **HttpOnly cookies** (cookie name: `token`)
- Roles: `SUPER_ADMIN`, `COUPLE_ADMIN`
- Token is read from cookies in `Program.cs` via `OnMessageReceived` event
- `IWeddingAuthorizationService` / `CanAccessWeddingAsync` enforces couple admin can only access their own wedding

### Frontend API Layer
All API calls go through `frontend/lib/api/` and are exported from `index.ts`. Each service file wraps an `apiClient` (Axios instance). **Always add new service methods to the relevant service file and re-export from `index.ts`.**

### Routing (Next.js App Router)
- `/` — public landing
- `/login` — shared login; redirects by role
- `/super-admin/*` — SUPER_ADMIN dashboard (weddings, packages, per-wedding tabs)
- `/couple-admin/*` — COUPLE_ADMIN dashboard + customize page
- `/wedding/[coupleName]/*` — public invitation pages (feature-gated)

### Frontend → Backend Proxy
`next.config.ts` rewrites:
- `/api/*` → `http://localhost:5000/api/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`

So all frontend fetches use relative paths (`/api/...`). `NEXT_PUBLIC_API_URL=/api` means `API_BASE = ''` for photo/static URLs.

### Feature Gating
Features (e.g. `PHOTO_BOOTH`, `RSVP`, `WISHES`) are toggled per-wedding via `WeddingFeature` junction table. Public pages check feature state before rendering tabs/sections.

### Template Customization
`WeddingTemplateConfig` stores key-value config per wedding. Schema defined in `frontend/lib/templateConfigSchema.ts` via `getConfigFields(templateId, role)`. Templates use a `t(key, fallback)` helper to resolve config values. `invite.body` is rich text (TipTap v3) rendered via `dangerouslySetInnerHTML`.

### EF Migrations (in order)
1. `AddFeaturesAndPhotos`
2. `AddTemplates`
3. `AddUsers`
4. `AddPhotoModeration`
5. `AddPackages`
6. `AddTemplateConfig`
7. `AddUserIsActive`

## Known Issues
- `guestService.create` posts to `/guest/wedding/${weddingId}` but the backend create endpoint is `POST /api/guest` with `WeddingId` in body — admin-side guest creation is broken
- `GET /api/wedding` is unprotected — any user can enumerate all weddings
- `handleToggleActive` in super-admin dashboard uses raw `fetch` instead of `apiClient`
