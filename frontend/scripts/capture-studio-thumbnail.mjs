/** Capture the PUBLIC published preview, never the editor's draft.
 * npm run studio:thumbnail -- --template 7 --state /path/to/playwright-storage-state.json
 * Add --watch to refresh after subsequent publishes while this process runs.
 */
import { chromium } from '@playwright/test';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const { values } = parseArgs({ options: {
  template: { type: 'string' }, state: { type: 'string' },
  base: { type: 'string', default: 'http://localhost:3000' }, watch: { type: 'boolean', default: false },
} });
const id = Number(values.template);
if (!Number.isInteger(id) || id < 1 || !values.state) {
  console.error('Provide --template <id> and --state <Playwright storage-state.json> containing a Super Admin session.');
  process.exit(1);
}
const base = new URL(values.base);
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid base URL.');
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: values.state, viewport: { width: 390, height: 700 }, reducedMotion: 'reduce' });
await context.addInitScript(() => localStorage.setItem('cookie-consent', 'accepted'));
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
process.on('SIGTERM', () => { stopped = true; });
let capturedHash;

async function responseJson(response) {
  if (response.status() === 401 || response.status() === 403) throw new Error('A current Super Admin session is required. Refresh the storage-state file.');
  if (!response.ok()) throw new Error(`Studio request failed (${response.status()}).`);
  return response.json();
}

try {
  const template = await responseJson(await context.request.get(new URL(`/api/template/${id}`, base).href));
  if (template.isAuthored) throw new Error('Authored thumbnails are not supported by Studio yet.');
  do {
    const state = await responseJson(await context.request.get(new URL(`/api/template/${id}/studio`, base).href));
    if (state.publishedDesignHash !== capturedHash) {
      const page = await context.newPage();
      try {
        await page.goto(new URL(`/template-preview/${encodeURIComponent(template.templateCode)}`, base).href, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-preview-ready]').waitFor({ timeout: 45000 });
        await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
        await page.evaluate(() => document.fonts.ready);
        await delay(2500);
        const buffer = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 700 } });
        const response = await context.request.post(new URL(`/api/template/${id}/studio/thumbnail`, base).href, {
          multipart: { file: { name: `${template.templateCode}.png`, mimeType: 'image/png', buffer },
            version: String(state.version), publishedDesignHash: state.publishedDesignHash },
        });
        if (response.status() === 409 && values.watch) {
          console.log('Design changed during capture; retrying on the next check.');
        } else {
          await responseJson(response);
          capturedHash = state.publishedDesignHash;
          console.log(`Refreshed published thumbnail: ${template.templateCode}`);
        }
      } finally { await page.close(); }
    }
    if (values.watch && !stopped) await delay(5000);
  } while (values.watch && !stopped);
} finally { await browser.close(); }
