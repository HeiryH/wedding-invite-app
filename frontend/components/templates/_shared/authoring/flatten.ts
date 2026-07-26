import { OVERRIDABLE, resolveStage } from '../layout';
import type { Layer, StageDef } from '../types';

/**
 * Turns one authored stage's live editing state — a (mostly empty) skeleton `StageDef` plus the
 * delta config bag the Adjust panel writes to (see layout.ts) — into a single self-contained
 * `StageDef`, exactly the shape `DataTemplate`/`TemplateWrapper` already know how to render with
 * no config bag at all. This is what gets persisted as `Template.StagesJson`.
 *
 * Reuses `resolveStage` unchanged: authoring IS couple-style delta editing, just against an
 * (almost) empty base instead of a shipped design, so every added layer already arrives as a
 * complete definition (see `resolveStage`'s "a layer the couple added" branch). Flattening only
 * has to fold the mobile/desktop resolution back into one `layers` + `desktop` override pair.
 */
export function flattenStage(prefix: string, def: StageDef, config: Record<string, string>): StageDef {
  const mobile = resolveStage(prefix, def, 'mobile', config);
  const desktop = resolveStage(prefix, def, 'desktop', config);

  // Union by id, mobile-first. A layer that exists only on desktop (added while editing at the
  // desktop breakpoint) still needs a mobile-side entry to live in the base `layers` array — start
  // it hidden there so it doesn't leak onto phones, and the per-id diff below un-hides it for desktop.
  const byId = new Map<string, Layer>();
  for (const l of mobile.layers) byId.set(l.id, l);
  for (const l of desktop.layers) if (!byId.has(l.id)) byId.set(l.id, { ...l, hidden: true });
  const layers = [...byId.values()];

  const desktopOverrides: Record<string, Partial<Layer>> = {};
  for (const l of layers) {
    const d = desktop.layers.find((x) => x.id === l.id);
    if (!d) continue;
    const diff: Partial<Layer> = {};
    let changed = false;
    for (const k of OVERRIDABLE) {
      if (d[k] !== l[k]) {
        (diff as Record<string, unknown>)[k] = d[k];
        changed = true;
      }
    }
    if (changed) desktopOverrides[l.id] = diff;
  }

  return {
    id: def.id,
    label: def.label,
    // A replaced background (bgSrc) becomes the new base image; otherwise keep whatever the
    // stage-management sidebar already set directly on the skeleton.
    bg: mobile.bgSrc ?? def.bg,
    bgFit: mobile.bgFit,
    bgPosition: mobile.bgPosition,
    bgScale: mobile.bgScale,
    layers,
    // Structural (author-set via the stage sidebar's "Flow" checkbox), not a per-wedding delta —
    // resolveStage never touches it, so it must be carried through by hand here or it would
    // silently vanish on every save.
    ...(def.flow ? { flow: true } : {}),
    ...(Object.keys(desktopOverrides).length ? { desktop: desktopOverrides } : {}),
  };
}

/**
 * Flattens every stage, in `stageOrder`. Stage ids must never be purely numeric strings ("1",
 * "2", …) — JS/JSON object key order promotes array-index-like keys to ascending numeric order
 * ahead of insertion order, which would silently scramble the render order `Object.keys()` later
 * relies on (see TemplateWrapper.tsx / the public wedding page's authored-template fallthrough).
 * The authoring UI always mints ids as `stage-<base36 timestamp>`, which is safe.
 */
export function flattenTemplate(
  prefix: string,
  skeleton: Record<string, StageDef>,
  stageOrder: string[],
  config: Record<string, string>,
): Record<string, StageDef> {
  const out: Record<string, StageDef> = {};
  for (const id of stageOrder) {
    const def = skeleton[id];
    if (def) out[id] = flattenStage(prefix, def, config);
  }
  return out;
}
