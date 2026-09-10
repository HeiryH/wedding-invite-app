import { chromium } from '@playwright/test';

const payload = {
  wedding: {
    weddingId: 999999, coupleName: 'qa-preview', brideName: 'Alex', groomName: 'Sam',
    weddingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    venue: 'Preview Venue', venueAddress: '123 Preview Street',
    totalGuests: 100, totalAttending: 0, daysUntilWedding: 30,
    isActive: true, isPublic: false, totalPhotos: 0, enabledFeaturesCount: 0,
    templateId: 11, templateName: 'rose-horizon', templateStagesJson: null, isRsvpOpen: true,
  },
  coupleMedia: [], wishes: [], photoBoothEnabled: true, customConfig: {},
  itinerary: [
    { itineraryItemId: 1, weddingId: 999999, label: 'Guest Arrival', detail: '10:00 AM', sortOrder: 0 },
  ],
  seatingEnabled: false, tables: [],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 402, height: 900 } });
const page = await context.newPage();

page.on('console', (msg) => console.log(`[console:${msg.type()}]`, msg.text()));
page.on('pageerror', (err) => console.log('[pageerror]', err.message));
page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

await context.addInitScript(([draft, cookieKey]) => {
  localStorage.setItem('preview_draft', JSON.stringify(draft));
  localStorage.setItem(cookieKey, 'accepted');
}, [payload, 'cookie-consent']);

await page.goto('http://localhost:3000/organizer-admin/preview', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

console.log('--- title ---', await page.title());
console.log('--- body text (first 500) ---', (await page.textContent('body'))?.slice(0, 500));
await page.screenshot({ path: '/tmp/rh-debug-full.png', fullPage: true });
console.log('screenshot saved to /tmp/rh-debug-full.png');

await browser.close();
