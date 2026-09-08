/**
 * Generates screenshot PNGs for each template's welcome page.
 * Run from the frontend/ directory: npm run generate-previews
 * Requires: Next.js dev server running on localhost:3000
 *
 * This is the only copy — the npm script resolves it from frontend/, and @playwright/test only
 * exists in frontend/node_modules. (There used to be a second copy at the repo root; the two
 * drifted, and `roman-garden` was added to the one npm never runs.)
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CODES = [
  'classic-rose',
  'golden-elegance',
  'garden-romance',
  'minimal-noir',
  'dreaming-floral-sky',
  'fairy-garden',
  'roman-garden',
  'gilded-arch',
  'engraved-certificate',
  'sunny-safari',
];

const BASE = 'http://localhost:3000';
const OUT = path.resolve(process.cwd(), 'public/template-previews');

fs.mkdirSync(OUT, { recursive: true });

console.log('Launching browser...');
const browser = await chromium.launch();

// Pre-accept the cookie banner: it renders over the bottom of every template and would
// otherwise be baked into each thumbnail.
const context = await browser.newContext({ viewport: { width: 390, height: 700 } });
await context.addInitScript(() => localStorage.setItem('cookie-consent', 'accepted'));

for (const code of CODES) {
  console.log(`  Screenshotting ${code}...`);
  const page = await context.newPage();

  await page.goto(`${BASE}/template-preview/${code}`, { waitUntil: 'domcontentloaded' });
  // The component signals readiness 1s after mount; the extra wait covers font + art decode.
  await page.waitForSelector('[data-preview-ready]', { timeout: 20000 });
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: path.join(OUT, `${code}.png`),
    clip: { x: 0, y: 0, width: 390, height: 700 },
  });

  console.log(`  ✓ ${code}.png`);
  await page.close();
}

await browser.close();
console.log(`\nDone — ${CODES.length} screenshots saved to public/template-previews/`);
