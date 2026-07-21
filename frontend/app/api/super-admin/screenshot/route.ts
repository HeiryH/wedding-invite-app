import { NextRequest, NextResponse } from 'next/server';

// Server-side screenshot capture for the super-admin "Screenshot tool": renders any existing
// wedding's real data through any template (an override, not necessarily their assigned one) and
// returns a PNG of the initial viewport. Runs headless Chromium in-process — see
// frontend/Dockerfile for how the browser binary gets into the production image.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:5000';
const SELF_ORIGIN = `http://127.0.0.1:${process.env.PORT ?? 3000}`;

const VIEWPORTS = {
  mobile: { width: 390, height: 700 },
  desktop: { width: 1280, height: 800 },
} as const;

export async function GET(req: NextRequest) {
  const coupleName = req.nextUrl.searchParams.get('coupleName');
  const templateId = req.nextUrl.searchParams.get('templateId');
  const breakpoint = req.nextUrl.searchParams.get('breakpoint') === 'desktop' ? 'desktop' : 'mobile';

  if (!coupleName || !templateId) {
    return NextResponse.json({ message: 'coupleName and templateId are required' }, { status: 400 });
  }

  const cookie = req.headers.get('cookie') ?? '';

  // Authorize: only a real SUPER_ADMIN session can trigger a capture. host-admins is a cheap,
  // already SUPER_ADMIN-gated endpoint we reuse purely as an auth probe.
  let authorized = false;
  try {
    const authCheck = await fetch(`${BACKEND_URL}/api/auth/host-admins`, { headers: { cookie }, cache: 'no-store' });
    authorized = authCheck.ok;
  } catch {
    authorized = false;
  }
  if (!authorized) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const tokenMatch = /(?:^|;\s*)token=([^;]+)/.exec(cookie);
  const token = tokenMatch?.[1];
  const viewport = VIEWPORTS[breakpoint];

  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport });

    // Seed the same client-side identity a real super-admin session has — the wedding page's
    // private-invite gate checks localStorage for a SUPER_ADMIN viewer (see
    // app/wedding/[coupleName]/page.tsx), and the token cookie authorizes the underlying data
    // fetches (CanAccessWeddingAsync already treats SUPER_ADMIN as universally allowed).
    await context.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'SUPER_ADMIN' }));
      localStorage.setItem('cookie-consent', 'accepted');
    });
    if (token) {
      await context.addCookies([{
        name: 'token', value: token,
        domain: new URL(SELF_ORIGIN).hostname, path: '/',
        httpOnly: true, sameSite: 'Lax',
      }]);
    }

    const page = await context.newPage();
    const target = `${SELF_ORIGIN}/wedding/${encodeURIComponent(coupleName)}?preview=${encodeURIComponent(templateId)}&capture=1`;
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('[data-preview-ready]', { timeout: 20000 });
    await page.waitForTimeout(300); // settle past the readiness marker

    const png = await page.screenshot({ clip: { x: 0, y: 0, ...viewport } });
    await browser.close();
    browser = undefined;

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${coupleName}-t${templateId}-${breakpoint}.png"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('screenshot capture failed', err);
    return NextResponse.json({ message: 'Screenshot capture failed' }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
