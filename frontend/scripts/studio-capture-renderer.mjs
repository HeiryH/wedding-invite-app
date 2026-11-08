/** Local renderer for Studio's Capture thumbnail button. No admin browser session required.
 * TEMPLATE_CAPTURE_WORKER_KEY must match the API's TemplateCapture__WorkerKey.
 * npm run studio:renderer -- --base http://localhost:3000 --api http://localhost:5050
 */
import { chromium, request } from '@playwright/test';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const { values } = parseArgs({ options: {
  base: { type: 'string', default: 'http://localhost:3000' },
  api: { type: 'string', default: 'http://localhost:5050' },
} });
const base = new URL(values.base);
const apiOrigin = new URL(values.api);
for (const url of [base, apiOrigin]) {
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid renderer host.');
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Use HTTPS for a remote renderer host.');
}
const key = process.env.TEMPLATE_CAPTURE_WORKER_KEY;
if (!key || key.length < 32) throw new Error('Set TEMPLATE_CAPTURE_WORKER_KEY to the API’s configured worker key (at least 32 characters).');
const workerBase = new URL('/api/template-capture-worker/', apiOrigin);
// Credentials are attached only to worker API requests, never to rendered pages.
const api = await request.newContext({ extraHTTPHeaders: { 'X-Capture-Worker-Key': key }, timeout: 15000 });
let browser;
let heartbeat;
let stopped = false;
process.on('SIGINT', () => { stopped = true; void browser?.close(); });
process.on('SIGTERM', () => { stopped = true; void browser?.close(); });

async function check(response) {
  if (!response.ok()) throw new Error(`Renderer API request failed (${response.status()}). Check worker configuration and API availability.`);
  return response;
}

async function render(job) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.templateCode) || !Number.isInteger(job.width) || !Number.isInteger(job.height) ||
      job.width < 200 || job.width > 2400 || job.height < 200 || job.height > 2400) throw new Error('Invalid capture job.');
  const context = await browser.newContext({ viewport: { width: job.width, height: job.height }, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('cookie-consent', 'accepted'));
  if (job.snapshot) await context.addInitScript(payload => {
    localStorage.setItem('preview_draft_v2', JSON.stringify(payload));
    localStorage.setItem('preview_capture_v1', '1');
  }, job.snapshot.payload);
  const page = await context.newPage();
  const target = new URL(job.snapshot ? '/organizer-admin/preview' : `/template-preview/${job.templateCode}`, base);
  let timeout;
  const allowed = new Set([base.origin, apiOrigin.origin]);
  await page.route('**/*', route => {
    const incoming = new URL(route.request().url());
    if ((allowed.has(incoming.origin) && ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) || ['data:', 'blob:'].includes(incoming.protocol)) return route.continue();
    return route.abort();
  });
  try {
    return await Promise.race([
      (async () => {
        await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
        if (new URL(page.url()).origin !== target.origin || new URL(page.url()).pathname !== target.pathname) throw new Error('Preview redirected unexpectedly.');
        if (job.snapshot) await page.locator('html[data-capture-ready="true"]').waitFor({ state: 'attached', timeout: 45000 });
        else await page.locator('[data-preview-ready]').waitFor({ timeout: 45000 });
        await page.addStyleTag({ content: 'nextjs-portal { display:none !important; }' });
        if (job.snapshot) await page.evaluate(({ scrollX, scrollY }) => window.scrollTo(scrollX, scrollY), job.snapshot);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async () => {
          const visible = [...document.images].filter(image => {
            const box = image.getBoundingClientRect();
            return box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0;
          });
          await Promise.all(visible.map(image => image.decode().catch(() => {})));
        });
        await delay(2500);
        return page.screenshot({ clip: { x: 0, y: 0, width: job.width, height: job.height }, timeout: 15000 });
      })(),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Capture timed out.')), 90000); }),
    ]);
  } finally { clearTimeout(timeout); await context.close(); }
}

try {
  browser = await chromium.launch();
  await check(await api.post(new URL('heartbeat', workerBase).href));
  heartbeat = setInterval(() => { void api.post(new URL('heartbeat', workerBase).href).catch(() => {}); }, 15000);
  console.log('Template renderer connected. Waiting for capture requests.');
  while (!stopped) {
    const response = await check(await api.post(new URL('claim', workerBase).href));
    if (response.status() === 204) { await delay(1500); continue; }
    const job = await response.json();
    try {
      const buffer = await render(job);
      const completed = await api.post(new URL(`${job.id}/complete`, workerBase).href, {
        multipart: { leaseToken: job.leaseToken, file: { name: 'capture.png', mimeType: 'image/png', buffer } },
      });
      // Cancellation or publication can invalidate a capture; discard it without approving it.
      if (completed.status() !== 409 && completed.status() !== 404) await check(completed);
      console.log(`Capture processed: ${job.templateCode}`);
    } catch {
      const failed = await api.post(new URL(`${job.id}/fail`, workerBase).href, { data: { leaseToken: job.leaseToken } });
      if (![204, 404, 409].includes(failed.status())) await check(failed);
      console.error(`Capture failed: ${job.templateCode}. Studio can retry.`);
    }
  }
} finally {
  clearInterval(heartbeat);
  await browser?.close();
  await api.dispose();
}
