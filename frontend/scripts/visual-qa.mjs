/**
 * visual-qa.mjs — Gate 4 for the invite pipeline: does an assembled template actually
 * render, per section, on a real phone screen? No database row, no PRO tier needed —
 * seeds a synthetic wedding straight into the `preview_draft` localStorage key that
 * `app/(standalone)/organizer-admin/preview/page.tsx` reads on mount (the storage key
 * was unified across the app — every write site uses bare `preview_draft`, including
 * `/personalise`, `/try`, and `/organizer-admin/customize`).
 *
 * Deliberately targets /organizer-admin/preview, NOT /template-preview/[code] — that route
 * clips to a hard 390x700 overflow:hidden box and silently renders blank + data-preview-ready
 * for an unregistered code (see this repo's CLAUDE.md).
 *
 * Run from frontend/ with the dev server up:
 *   npm run dev &
 *   node scripts/visual-qa.mjs <templateId> <slug>
 *
 * Requires: @playwright/test (already in frontend/node_modules).
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const templateId = Number(process.argv[2]);
const slug = process.argv[3];
if (!templateId || !slug) {
  console.error('usage: node visual-qa.mjs <templateId> <slug>');
  process.exit(2);
}

const BASE = 'http://localhost:3000';
const OUT = path.resolve(process.cwd(), `docs/${slug}-qa`);
fs.mkdirSync(OUT, { recursive: true });

// Minimal synthetic wedding — enough for TemplateWrapper to route to TEMPLATE_ENGINES[id]
// and for every slot to render its empty/placeholder state without crashing.
const payload = {
  wedding: {
    weddingId: 999999,
    coupleName: 'qa-preview',
    brideName: 'Alex',
    groomName: 'Sam',
    weddingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    venue: 'Preview Venue',
    venueAddress: '123 Preview Street',
    totalGuests: 100,
    totalAttending: 0,
    daysUntilWedding: 30,
    isActive: true,
    isPublic: false,
    totalPhotos: 0,
    enabledFeaturesCount: 0,
    templateId,
    templateName: slug,
    templateStagesJson: null,
    isRsvpOpen: true,
  },
  coupleMedia: [],
  wishes: [],
  photoBoothEnabled: true,
  customConfig: {},
  // Field names must match the real ItineraryItem shape — itineraryItemId / label / detail,
  // as written by app/personalise/page.tsx and read by ItineraryListSlot. This payload used
  // to say { id, title, time }, which matches nothing: every row rendered empty, so the
  // itinerary stage looked broken in every QA capture while the product itself was fine.
  // Four rows rather than two, so the list's own height and overflow behaviour get exercised.
  itinerary: [
    { itineraryItemId: 1, weddingId: 999999, label: 'Guest Arrival', detail: '10:00 AM', sortOrder: 0 },
    { itineraryItemId: 2, weddingId: 999999, label: 'Akad Nikah', detail: '11:00 AM', sortOrder: 1 },
    { itineraryItemId: 3, weddingId: 999999, label: 'Feast', detail: '12:30 PM', sortOrder: 2 },
    { itineraryItemId: 4, weddingId: 999999, label: 'Reception', detail: '6:00 PM', sortOrder: 3 },
  ],
  seatingEnabled: false,
  tables: [],
};

const BREAKPOINTS = [
  { name: 'mobile', width: 402, height: 714 },
  { name: 'desktop', width: 1280, height: 720 },
];

const browser = await chromium.launch();
let failures = 0;

for (const bp of BREAKPOINTS) {
  console.log(`\n=== ${bp.name} (${bp.width}x${bp.height}) ===`);
  const context = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    reducedMotion: 'reduce', // reveal is IntersectionObserver-gated one-shot; without this,
                              // anything not scrolled into view captures un-revealed
  });
  await context.addInitScript(
    ([draft, cookieKey]) => {
      localStorage.setItem('preview_draft', JSON.stringify(draft));
      // Suppress the CookieConsent banner — without this, the banner overlays the bottom of every
      // capture and hides whichever stage prop lands there (the wish list, the itinerary list,
      // the photobooth vase/camera, etc.). The app checks `cookie-consent` in localStorage and
      // renders the banner only when it's missing (see components/CookieConsent.tsx).
      localStorage.setItem(cookieKey, 'accepted');
    },
    [payload, 'cookie-consent']
  );

  const page = await context.newPage();
  await page.goto(`${BASE}/organizer-admin/preview`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500); // font + art decode

  const stageIds = await page.$$eval('[data-stage]', (els) => els.map((el) => el.getAttribute('data-stage')));
  if (stageIds.length === 0) {
    console.error(`  FAIL: no [data-stage] elements found — template ${templateId} did not render at all`);
    failures++;
    await context.close();
    continue;
  }
  console.log(`  found ${stageIds.length} stage(s): ${stageIds.join(', ')}`);

  for (const stageId of stageIds) {
    const el = await page.$(`[data-stage="${stageId}"]`);
    if (!el) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600); // let the reveal + parallax settle after scroll

    const box = await el.boundingBox();
    if (!box || box.width === 0 || box.height === 0) {
      console.error(`  FAIL: ${stageId} has zero-size bounding box`);
      failures++;
      continue;
    }

    const outPath = path.join(OUT, `${bp.name}-${stageId}.png`);
    await page.screenshot({ path: outPath, clip: box });

    // Reject a uniform-colour capture — the specific trap this script exists to catch:
    // a blank/unrendered stage would otherwise pass just by having a non-zero box.
    const isBlank = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const first = [data[0], data[1], data[2]];
      for (let i = 4; i < data.length; i += 4 * 97) { // sample, not every pixel
        if (Math.abs(data[i] - first[0]) > 6 || Math.abs(data[i + 1] - first[1]) > 6 || Math.abs(data[i + 2] - first[2]) > 6) {
          return false;
        }
      }
      return true;
    }, `file://${outPath}`).catch(() => false); // decode failure isn't a blank-page verdict

    if (isBlank) {
      console.error(`  FAIL: ${stageId} screenshot is a uniform colour — looks unrendered`);
      failures++;
    } else {
      console.log(`  PASS: ${stageId} -> ${outPath}`);
    }
  }

  await context.close();
}

await browser.close();

console.log(`\nvisual-qa: ${failures} failure(s)`);
process.exit(failures > 0 ? 1 : 0);
