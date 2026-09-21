import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigFields } from '../templateConfigSchema';

// Guards the class of bug fixed 2026-09-09: a schema field declared for a template whose markup
// never reads the key (T7's nav.size/nav.textSize sat inside TEMPLATE5_EXTRA_FIELDS — an array
// TEMPLATE_CONFIGS[7] never composes — so the control existed in the inspector's data model but no
// couple could ever reach it end to end). For every field the schema declares for a given
// templateId, this asserts the key string appears as a literal somewhere in the source that
// template actually renders through. See CLAUDE.md's existing verification convention:
// `grep -rl "<key>" frontend/components/templates/` before widening a field's templateIds.
//
// This is a literal-text search, not a real usage analysis — it passes as long as the key string
// appears anywhere in the scoped files (e.g. inside a `{ code: 'nav.welcome' }` lookup-map entry
// that's read via a computed key, not just a direct `t('nav.welcome', …)` call). That's deliberate:
// a false negative (missing a real dead-field bug) is the acceptable failure mode for a fast,
// dependency-free guard test — a false positive (blocking a legitimate change) is not.

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(HERE, '..', '..', 'components', 'templates');
const LIB_DIR = join(HERE, '..');

// Shared helpers outside components/templates/ that every template (Classic and Stage alike)
// pulls config keys through — `headingStyle`/`headingAnimationProps` in particular read
// invite.heading.color/.shadow/.animation on the template's behalf, so those keys are never a
// literal `t('invite.heading.color', …)` call site inside any Template*.tsx file itself.
const SHARED_LIB_FILES = ['templateUtils.ts'];

/** Where each templateId's markup actually lives — mirrors the directory layout in
 *  components/templates/ (see registry.ts's TEMPLATE_ENGINES for the same per-template mapping
 *  at the stage-engine level). T5/T7/T10 reach into `_shared/` for slot content, anchors, and the
 *  Adjust panel, so their scope includes it; the flow-only Classic templates (T1-T4/T6/T8/T9)
 *  don't need it — their config reads live entirely in their own file/folder. */
const TEMPLATE_ROOTS: Record<number, string[]> = {
  1: ['Template1.tsx', 'Template1-classicrose'],
  2: ['Template2.tsx', 'Template2-goldenelegance'],
  3: ['Template3.tsx', 'Template3-gardenromance'],
  4: ['Template4.tsx', 'Template4-minimalnoir'],
  5: ['Template5.tsx', 'Template5-dreamingfloral', '_shared'],
  6: ['Template6.tsx', 'Template6-fairygarden'],
  7: ['Template7.tsx', 'Template7-romangarden', '_shared'],
  8: ['Template8.tsx'],
  9: ['Template9.tsx'],
  10: ['Template10.tsx', 'Template10-sunnysafari', '_shared'],
  12: ['Template12.tsx', 'Template12-dreamywoodland', '_shared'],
  14: ['Template14.tsx', 'Template14-sandybeach', '_shared'],
};

/** Keys with no literal call site anywhere in template markup — read some other way (a backend-
 *  only policy check, a structural per-layer delta key that's never grepped as a whole literal,
 *  etc). Kept short and commented: every entry here is a deliberate exemption from the check, not
 *  a place to dump a failure you didn't investigate. */
const NOT_LITERALLY_READ = new Set<string>([
  // Backend-only moderation setting — PhotoService.cs reads it when a photo is uploaded, no
  // template ever renders it as UI. See backend/WeddingInvite.Core/Services/PhotoService.cs.
  'photobooth.autoApprove',
  // Built from a computed `sheet.${sheetId}.label` / `sheet.${sheetId}.image` template literal in
  // _shared/slots/SheetTriggerSlot.tsx — the key string itself never appears verbatim in source.
  'sheet.rsvp.label',
  'sheet.rsvp.image',
  'sheet.wish.label',
  'sheet.wish.image',
]);

function isLayoutKey(key: string): boolean {
  return /^ta?\d+\.layout\./.test(key);
}

function collectFiles(root: string, out: string[]): void {
  const st = statSync(root, { throwIfNoEntry: false });
  if (!st) return; // a template with no folder half (e.g. Template8) — root list just omits it
  if (st.isFile()) { out.push(root); return; }
  for (const entry of readdirSync(root)) {
    if (entry === 'node_modules' || entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) continue;
    collectFiles(join(root, entry), out);
  }
}

function readScopedSource(templateId: number): string {
  const files: string[] = [];
  for (const rel of TEMPLATE_ROOTS[templateId] ?? []) collectFiles(join(TEMPLATES_DIR, rel), files);
  for (const rel of SHARED_LIB_FILES) collectFiles(join(LIB_DIR, rel), files);
  return files
    .filter((f) => /\.(tsx?|css)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
}

describe('templateConfigSchema field scoping', () => {
  const templateIds = Object.keys(TEMPLATE_ROOTS).map(Number);
  const sourceByTemplate = new Map<number, string>();
  for (const id of templateIds) sourceByTemplate.set(id, readScopedSource(id));

  for (const templateId of templateIds) {
    it(`every field declared for template ${templateId} is read somewhere in its own source`, () => {
      // role: 'SUPER_ADMIN' bypasses the adminOnly/minTier filters, so this sees the full raw set
      // the schema declares for this templateId — the thing we actually want to check.
      const fields = getConfigFields(templateId, 'SUPER_ADMIN');
      const source = sourceByTemplate.get(templateId)!;

      const unreached = fields
        .map((f) => f.key)
        .filter((key) => !NOT_LITERALLY_READ.has(key))
        .filter((key) => !isLayoutKey(key))
        .filter((key) => !source.includes(key));

      expect(
        unreached,
        `template ${templateId} declares these keys but nothing under ` +
        `${TEMPLATE_ROOTS[templateId].join(', ')} reads them literally — either the templateIds ` +
        `on the field is wrong, or the field belongs in NOT_LITERALLY_READ with a comment saying why.`,
      ).toEqual([]);
    });
  }

  it('exposes Dreamy Woodland copy and shared-slot controls', () => {
    const keys = new Set(getConfigFields(12, 'SUPER_ADMIN').map((field) => field.key));
    for (const key of [
      'invite.heading', 'section.order', 'walimah.body', 'walimah.title',
      'rsvp.title', 'rsvp.subtitle', 'rsvp.name_placeholder', 'rsvp.submit_label',
      'sheet.rsvp.label', 'sheet.rsvp.image', 'itinerary.title',
      'wish.title', 'wish.prompt', 'wish.form_title', 'wish.submit_label',
      'sheet.wish.label', 'sheet.wish.image', 'photobooth.title',
      'photobooth.prompt', 'photobooth.upload_label', 'photobooth.frameArt',
      'footer.tagline',
    ]) {
      expect(keys.has(key), `${key} should be editable for template 12`).toBe(true);
    }
  });
});
