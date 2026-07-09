# Go-Live Runbook — turning on email, monitoring, secret & domains

Everything below is done on the **VPS** (`139.180.154.175`, app at `/opt/wedding-app`).
All settings live in the server's `.env` file (`/opt/wedding-app/.env`) — **never commit it**.
After editing `.env`, apply changes with:

```bash
cd /opt/wedding-app
docker compose up -d          # recreates containers with the new env
```

Do the steps in this order. Each is independent — you can stop after any of them.

---

## 1. Email  (so password-reset + RSVP emails actually send)

Without this, the app still works — it just skips sending (logged, no crash). Turn it on
with any SMTP provider. **Brevo** is a good free choice that works from Brunei.

**a. Get SMTP credentials** (Brevo example)
1. Sign up at brevo.com → **SMTP & API** → **SMTP**.
2. Note the values it shows: *SMTP server* (`smtp-relay.brevo.com`), *port* (`587`),
   *login* (your Brevo login email), and a generated *SMTP key* (this is the password).
3. Verify a sender address (the "from" address, e.g. `no-reply@oddstudio.app`).

**b. Add to `/opt/wedding-app/.env`:**
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-login@example.com
EMAIL_PASS=your-brevo-smtp-key
EMAIL_FROM=no-reply@oddstudio.app
EMAIL_FROM_NAME=ODDSTUDIO
EMAIL_USE_STARTTLS=true
```

**c. Apply + test:**
```bash
docker compose up -d
# then trigger a reset email to an address you own:
curl -X POST https://oddstudio.app/api/auth/forgot-password \
  -H "Content-Type: application/json" -d '{"email":"you@youraddress.com"}'
```
You should receive a "Reset your ODDSTUDIO password" email within a minute. If not, check
`docker compose logs backend | grep -i email`.

---

## 2. Error monitoring (Sentry) — optional

Get crash alerts. Skip if you don't want it yet — the app runs fine without it.

1. Free account at sentry.io → create a project (platform: **.NET**) → copy its **DSN**
   (looks like `https://abc123@o0.ingest.sentry.io/123`).
2. Add to `.env`:
   ```env
   SENTRY_DSN=https://abc123@o0.ingest.sentry.io/123
   ```
3. `docker compose up -d`. Errors will now appear in your Sentry dashboard.
   *(Frontend Sentry is not wired yet — this covers the backend only.)*

---

## 3. Rotate the secret key — security must-do

The old JWT signing key was once committed to git history, so it must be replaced.
**Effect:** everyone is logged out once and signs back in (normal).

**a. Generate a fresh key** (run locally or on the VPS):
```bash
openssl rand -base64 48
```

**b. Set it in `/opt/wedding-app/.env`:**
```env
JWT_SECRET=<paste-the-generated-value>
```

**c. Apply:**
```bash
docker compose up -d
```
The backend refuses to start with the old leaked key or an empty/short one, so if it comes
up healthy (`curl https://oddstudio.app/health` → `Healthy`), you're set.

---

## 4. Custom domains (couples' own web addresses) — biggest one, do last

The application + middleware are already deployed. The remaining one-time infrastructure
setup (adding a **Caddy** service for automatic HTTPS + per-couple DNS) is documented
separately in **[CUSTOM_DOMAINS.md](./CUSTOM_DOMAINS.md)**. Follow that guide when ready.

---

## Quick health check (any time)
```bash
curl https://oddstudio.app/health          # → Healthy
docker compose ps                          # all services "Up"
docker compose logs -f backend             # watch for errors
```
