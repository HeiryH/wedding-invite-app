import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom-domain host resolution (PRO tier).
 *
 * When a request arrives on a couple's own domain (e.g. john-and-mary.com), we look the
 * host up in the backend and transparently rewrite it to that wedding's public invite
 * (`/wedding/[coupleName]`). Requests on the platform's own hosts pass straight through,
 * so the admin dashboards, funnel, etc. are unaffected.
 *
 * The backend (`GET /api/wedding/by-domain`) is the source of truth; this only rewrites.
 * Pair with reverse-proxy TLS for arbitrary domains (Caddy on-demand TLS or nginx+certbot)
 * and each couple pointing their DNS A/CNAME at the server.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

// Hosts that are the platform itself — never treated as custom domains.
// Configurable via PLATFORM_HOSTS (comma-separated); localhost + the primary site host
// (from NEXT_PUBLIC_SITE_URL) are always included.
const PLATFORM_HOSTS = new Set(
  [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    hostFromUrl(process.env.NEXT_PUBLIC_SITE_URL),
    ...(process.env.PLATFORM_HOSTS ?? '')
      .split(',')
      .map((h) => normalizeHost(h))
      .filter(Boolean),
  ].filter(Boolean) as string[],
);

// Small in-memory cache so we don't hit the backend on every request.
// Keyed by normalized host → couple slug (or null when unmapped). Per-worker, TTL'd.
type CacheEntry = { coupleName: string | null; expires: number };
const CACHE_TTL_MS = 60_000;
const resolveCache = new Map<string, CacheEntry>();

function normalizeHost(host: string | null | undefined): string {
  if (!host) return '';
  let h = host.trim().toLowerCase();
  h = h.split(':')[0]; // strip port
  if (h.startsWith('www.')) h = h.slice(4);
  return h;
}

function hostFromUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    return normalizeHost(new URL(url).host);
  } catch {
    return '';
  }
}

async function resolveCouple(host: string): Promise<string | null> {
  const cached = resolveCache.get(host);
  if (cached && cached.expires > Date.now()) return cached.coupleName;

  let coupleName: string | null = null;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/wedding/by-domain?domain=${encodeURIComponent(host)}`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (res.ok) {
      const data = await res.json();
      coupleName = data?.coupleName ?? null;
    }
  } catch {
    // Network/timeout: fail open (pass through). Cache the miss briefly.
    coupleName = null;
  }

  resolveCache.set(host, { coupleName, expires: Date.now() + CACHE_TTL_MS });
  return coupleName;
}

export async function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get('host'));

  // Platform host (or unknown/empty): serve the app normally.
  if (!host || PLATFORM_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  // Already an invite path, or an internal one → don't touch.
  if (pathname.startsWith('/wedding/')) return NextResponse.next();

  const coupleName = await resolveCouple(host);
  if (!coupleName) return NextResponse.next(); // unmapped domain → normal handling (404s)

  // Map the custom-domain path onto the wedding: "/" → invite root, "/rsvp" → invite/rsvp, …
  const suffix = pathname === '/' ? '' : pathname;
  const url = request.nextUrl.clone();
  url.pathname = `/wedding/${coupleName}${suffix}`;
  return NextResponse.rewrite(url);
}

// Skip API, static assets, uploads, and Next internals — only page requests need resolving.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|uploads|favicon.ico|.*\\.[\\w]+$).*)'],
};
