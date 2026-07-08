# Custom Domains (PRO tier) — deployment guide

A PRO couple can serve their invitation on their own domain (e.g. `john-and-mary.com`).
The application layer is done; this is the one-time infrastructure setup on the VPS
(`139.180.154.175`, app at `/opt/wedding-app`).

## How it works

```
guest → https://john-and-mary.com
        │
        ▼
    Caddy (:443)  ── on-demand TLS, asks: ──►  GET /api/wedding/by-domain?domain=john-and-mary.com
        │                                       (200 = registered → issue cert; 404 = refuse)
        ▼
    frontend:3000  ── middleware.ts rewrites Host → /wedding/[coupleName] ──►  the invite
```

- **Backend** (`GET /api/wedding/by-domain`) is the source of truth and doubles as Caddy's
  on-demand-TLS `ask` guard — no separate endpoint needed.
- **`frontend/middleware.ts`** maps the incoming Host to the right wedding.
- **Caddy** terminates TLS and auto-issues a cert per custom domain, but only for domains
  the `ask` approves.

## 1. Add Caddy to `docker-compose.yml`

Add this service (replaces the host-level `nginx.conf`, which was only the starter scaffold):

```yaml
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"        # HTTP/3
    environment:
      - ACME_EMAIL=you@oddstudio.app        # a real address for Let's Encrypt
      - PLATFORM_DOMAIN=oddstudio.app
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data     # persists issued certs — don't lose this
      - caddy_config:/config
    depends_on:
      - frontend
      - backend

volumes:      # merge into the existing top-level `volumes:` if present
  caddy_data:
  caddy_config:
```

And stop publishing the frontend port to the host — let Caddy reach it over the internal
network instead (defense-in-depth):

```yaml
  frontend:
    # ports:            ← remove this
    #   - "3000:3000"
    expose:
      - "3000"           ← add this
```

## 2. Turn off the host nginx

Caddy binds `:80`/`:443`, so the host's nginx must not:

```bash
sudo systemctl disable --now nginx   # or remove the wedding-app site from sites-enabled
```

## 3. Bring it up

```bash
cd /opt/wedding-app
docker compose up -d caddy
docker compose logs -f caddy         # watch the first cert issuance
```

The platform domain (`oddstudio.app`) gets its cert immediately. Custom-domain certs are
issued lazily on the first HTTPS hit once DNS points at the server.

## 4. Per-couple onboarding

For each PRO couple:
1. In the couple/admin UI, set the custom domain (`PUT /api/wedding/{id}/domain`) — this is
   what makes the `ask` return 200 for that host.
2. Have the couple create a DNS record at their registrar:
   - **Apex** (`john-and-mary.com`): `A` record → `139.180.154.175`
   - **or subdomain** (`www` / `rsvp.…`): `CNAME` → `oddstudio.app`
3. First visit over HTTPS triggers automatic certificate issuance. Done.

## Notes / gotchas

- **DNS must resolve before the cert can issue** — Let's Encrypt validates over HTTP/TLS.
- **`caddy_data` volume is precious** — it holds issued certs and the ACME account. Back it up.
- The frontend already treats `oddstudio.app` (from `NEXT_PUBLIC_SITE_URL`) as a platform
  host. To add more platform hosts, set `PLATFORM_HOSTS=a.com,b.com` on the frontend service.
- Rollback: re-enable nginx and remove the caddy service. Stored custom domains stay in the
  DB harmlessly (they just won't resolve without the proxy).
```
