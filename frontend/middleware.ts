import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_EVENT_TYPE_SLUGS, urlSegmentForEventType } from '@/lib/eventTypes';

/**
 * Custom-domain host resolution (PRO tier).
 *
 * When a request arrives on an event owner's own domain (e.g. john-and-mary.com), we look the
 * host up in the backend and transparently rewrite it to that event's public invite
 * (`/wedding/[slug]`, `/party/[slug]`, or `/ceremony/[slug]` — whichever matches the event's
 * actual type; custom domains aren't WEDDING-only, the tier/feature gate is generic). Requests
 * on the platform's own hosts pass straight through, so the admin dashboards, funnel, etc. are
 * unaffected.
 *
 * The backend (`GET /api/event/by-domain`) is the source of truth (its `EventDto` response
 * already carries `slug` + `eventType`); this only rewrites. Pair with reverse-proxy TLS for
 * arbitrary domains (Caddy on-demand TLS or nginx+certbot) and each owner pointing their DNS
 * A/CNAME at the server.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';

// Any of the 3 public invite prefixes — an already-prefixed path is left untouched.
const INVITE_PREFIXES = Object.values(PUBLIC_EVENT_TYPE_SLUGS).map((s) => `/${s}/`);

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
// Keyed by normalized host → { slug, eventType } (or null when unmapped). Per-worker, TTL'd.
type ResolvedEvent = { slug: string; eventType: string };
type CacheEntry = { event: ResolvedEvent | null; expires: number };
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

async function resolveEvent(host: string): Promise<ResolvedEvent | null> {
  const cached = resolveCache.get(host);
  if (cached && cached.expires > Date.now()) return cached.event;

  let event: ResolvedEvent | null = null;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/event/by-domain?domain=${encodeURIComponent(host)}`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (res.ok) {
      const data = await res.json();
      event = data?.slug ? { slug: data.slug, eventType: data.eventType } : null;
    }
  } catch {
    // Network/timeout: fail open (pass through). Cache the miss briefly.
    event = null;
  }

  resolveCache.set(host, { event, expires: Date.now() + CACHE_TTL_MS });
  return event;
}

export async function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get('host'));

  // Platform host (or unknown/empty): serve the app normally.
  if (!host || PLATFORM_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  // Already an invite path (any of the 3 type prefixes), or an internal one → don't touch.
  if (INVITE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const event = await resolveEvent(host);
  if (!event) return NextResponse.next(); // unmapped domain → normal handling (404s)

  // Map the custom-domain path onto the event's type-correct invite prefix:
  // "/" → invite root, "/rsvp" → invite/rsvp, …
  const suffix = pathname === '/' ? '' : pathname;
  const segment = urlSegmentForEventType(event.eventType);
  const url = request.nextUrl.clone();
  url.pathname = `/${segment}/${event.slug}${suffix}`;
  return NextResponse.rewrite(url);
}

// Skip API, static assets, uploads, and Next internals — only page requests need resolving.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|uploads|favicon.ico|.*\\.[\\w]+$).*)'],
};
