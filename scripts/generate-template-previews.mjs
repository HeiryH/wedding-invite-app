/**
 * Generates screenshot PNGs for each template's welcome page.
 * Run from the frontend/ directory: npm run generate-previews
 * Requires: Next.js dev server running on localhost:3000
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
];

// CWD is frontend/ when called via npm script
const BASE = 'http://localhost:3000';
const OUT = path.resolve(process.cwd(), 'public/template-previews');

fs.mkdirSync(OUT, { recursive: true });

console.log('Launching browser...');
const browser = await chromium.launch();

for (const code of CODES) {
  console.log(`  Screenshotting ${code}...`);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 700 });

  await page.goto(`${BASE}/template-preview/${code}`, { waitUntil: 'domcontentloaded' });

  // Wait for the component to signal it's ready (1s after mount)
  await page.waitForSelector('[data-preview-ready]', { timeout: 20000 });

  await page.screenshot({
    path: path.join(OUT, `${code}.png`),
    clip: { x: 0, y: 0, width: 390, height: 700 },
  });

  console.log(`  ✓ ${code}.png`);
  await page.close();
}

await browser.close();
console.log(`\nDone — ${CODES.length} screenshots saved to frontend/public/template-previews/`);
