#!/usr/bin/env node
/**
 * Cuts Template 10 (Sunny Safari) prop sheets into individual transparent WebP layers.
 *
 * Each `sunny-safari-<section>/sunny-safari-<section>-props.png` is a single 1024x1696
 * transparent sheet with every prop for that scene composed at its final, art-directed position
 * (against the section's own -bg.png). Connected-component analysis over the alpha channel finds
 * each prop's bounding box, which is cropped to its own WebP and converted straight to layer
 * percentages — the stage's `canvas` aspect (1024x1696, the art's own canvas) matches the source
 * pixels exactly, so no scale-factor correction is needed (see the T10 plan's "key insight").
 *
 * Usage: node scripts/extract-t10-props.mjs <path-to-sunny-safari-assets-dir>
 * Output: frontend/public/templates/t10/<section>/prop-<n>.webp + <section>/props.manifest.json
 *
 * Re-run whenever the artist revises the art. Renaming prop-<n>.webp to a semantic name is a
 * manual follow-up step (update the manifest's `file` field to match) — this script only cuts.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = join(__dirname, '..', 'public', 'templates', 't10');
const CANVAS = { w: 1024, h: 1696 };
const AREA_THRESHOLD = 3000;

const srcRoot = process.argv[2];
if (!srcRoot) {
  console.error('Usage: node extract-t10-props.mjs <path-to-sunny-safari-assets-dir>');
  process.exit(1);
}

const SECTIONS = ['welcome', 'itinerary', 'rsvp', 'wishes', 'photobooth'];

for (const section of SECTIONS) {
  // welcome's sheet is singular "-prop.png"; the rest are plural "-props.png".
  const candidates = [
    join(srcRoot, `sunny-safari-${section}`, `sunny-safari-${section}-props.png`),
    join(srcRoot, `sunny-safari-${section}`, `sunny-safari-${section}-prop.png`),
  ];
  const sheet = candidates.find(existsSync);
  if (!sheet) {
    console.warn(`[skip] no props sheet found for ${section}`);
    continue;
  }

  const outDir = join(OUT_ROOT, section);
  mkdirSync(outDir, { recursive: true });

  const raw = execFileSync('magick', [
    sheet,
    '-alpha', 'extract',
    '-threshold', '20%',
    '-define', 'connected-components:verbose=true',
    `-define`, `connected-components:area-threshold=${AREA_THRESHOLD}`,
    '-connected-components', '8',
    'null:',
  ], { encoding: 'utf8' });

  const objects = [];
  for (const line of raw.split('\n')) {
    // "  11: 163x342+818+1275 897.4,1441.4 45232 srgb(255,255,255)"
    const m = line.match(/^\s*(\d+):\s+(\d+)x(\d+)\+(-?\d+)\+(-?\d+)\s+[\d.]+,[\d.]+\s+([\d.e+]+)/);
    if (!m) continue;
    const [, id, w, h, x, y, area] = m;
    // Skip the background/transparent-field component. ImageMagick always assigns this id 0 —
    // relying on that (rather than matching the full 1024x1696 canvas dims) because a shorter
    // sheet (e.g. the wishes sheet is only 1024x1255) has a background component whose size
    // doesn't match the nominal canvas at all.
    if (Number(id) === 0) continue;
    objects.push({ id: Number(id), bw: Number(w), bh: Number(h), bx: Number(x), by: Number(y), area: Number(area) });
  }
  // Drop any component whose bounding box sits fully inside a larger component's box. A thin
  // cord/strap or a lens dot often renders as an alpha-disconnected fragment of the object it
  // belongs to (antialiasing gap, color break) — but a rectangular crop of the larger object
  // already contains those pixels, so keeping the fragment as its own file just duplicates them
  // and would ship as a redundant, unlabelable extra layer.
  const contains = (big, small) =>
    small.bx >= big.bx && small.by >= big.by &&
    small.bx + small.bw <= big.bx + big.bw && small.by + small.bh <= big.by + big.bh;
  const byArea = [...objects].sort((a, b) => b.area - a.area);
  const dropped = new Set();
  for (let i = 0; i < byArea.length; i++) {
    if (dropped.has(byArea[i].id)) continue;
    for (let j = i + 1; j < byArea.length; j++) {
      if (!dropped.has(byArea[j].id) && contains(byArea[i], byArea[j])) dropped.add(byArea[j].id);
    }
  }
  const kept = objects.filter((o) => !dropped.has(o.id));
  if (dropped.size) {
    console.log(`  [${section}] dropped ${dropped.size} contained fragment(s): ids ${[...dropped].join(', ')}`);
  }
  // Reading order (top-to-bottom, then left-to-right) — not because it matters mechanically, but
  // so prop-01, prop-02... come out in a predictable sequence for the manual renaming pass. Raw
  // connected-components output order is an implementation-detail scan order, not this.
  kept.sort((a, b) => (a.by - b.by) || (a.bx - b.bx));

  const manifest = [];
  kept.forEach((o, i) => {
    const n = String(i + 1).padStart(2, '0');
    const file = `prop-${n}.webp`;
    const cropped = `${o.bw}x${o.bh}+${o.bx}+${o.by}`;
    execFileSync('magick', [sheet, '-crop', cropped, '+repage', join(outDir, file)]);

    const cx = o.bx + o.bw / 2;
    const cy = o.by + o.bh / 2;
    manifest.push({
      file,
      bx: o.bx, by: o.by, bw: o.bw, bh: o.bh,
      x: Math.round((cx / CANVAS.w) * 1000) / 10,
      y: Math.round((cy / CANVAS.h) * 1000) / 10,
      w: Math.round((o.bw / CANVAS.w) * 1000) / 10,
    });
  });

  writeFileSync(join(outDir, 'props.manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[${section}] cut ${manifest.length} props -> ${outDir}`);
}
