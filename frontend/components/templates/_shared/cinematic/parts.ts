import type { CinematicWorldLayer } from './world';

export interface CinematicPartsOptions { frames?: number; programmeItems?: number }
export const cinematicPartId = (parentId: string, part: string) => `${parentId}--${part}`;

/** Persisted children are distinct from Stage's non-persisted `parent` hint. The local
 * origin is the authored DOM slot: 50/50, 100% scale is a lossless legacy migration.
 * Keeping the slot in flow preserves variable-length content and responsive typography. */
export function expandCinematicParts(layers: CinematicWorldLayer[], options: CinematicPartsOptions = {}): CinematicWorldLayer[] {
  const active = layers.filter((layer) => {
    const index = layer.part?.match(/^(frame|row|time|label)-(\d+)$/);
    if (!index) return true;
    const root = cinematicAncestors(layer, layers).at(-1);
    if (index[1] === 'frame' && root?.behavior === 'memory-wall' && options.frames !== undefined) return Number(index[2]) < options.frames;
    if (root?.behavior === 'programme-board' && options.programmeItems !== undefined) return Number(index[2]) < options.programmeItems;
    return true;
  });
  const byId = new Map(active.map((layer) => [layer.id, layer]));
  for (const root of layers.filter((layer) => !layer.parentId)) {
    const add = (part: string, label: string, kind: CinematicWorldLayer['kind'] = 'text', parentId = root.id) => {
      const existing = [...byId.values()].find((item) => item.parentId === parentId && item.part === part);
      if (existing) return existing.id;
      const id = cinematicPartId(root.id, part);
      if (!byId.has(id)) byId.set(id, { id, label, group: root.group, space: root.space,
        kind, parentId, part, x: 50, y: 50, w: 100, z: 0, rotation: 0,
        flipX: false, hidden: false, locked: false, opacity: 1 });
      return id;
    };
    if (root.behavior === 'programme-board') {
      add('artwork', 'Board artwork', 'img');
      const copy = add('copy', 'Programme copy', 'functional');
      add('title', 'Programme heading', 'text', copy);
      add('items', 'Programme items', 'functional', copy);
      add('venue', 'Programme venue', 'text', copy);
      add('calendar', 'Programme calendar label', 'text', copy);
      for (let i = 0; i < Math.min(100, options.programmeItems ?? 3); i++) {
        const row = add(`row-${i}`, `Programme entry ${i + 1}`, 'functional', copy);
        add(`time-${i}`, `Time ${i + 1}`, 'text', row);
        add(`label-${i}`, `Activity ${i + 1}`, 'text', row);
      }
      add('action', 'Programme action');
    } else if (root.behavior === 'rsvp-envelope') {
      add('artwork', 'Envelope artwork', 'img');
      const paper = add('paper', 'RSVP letter', 'functional');
      add('subtitle', 'RSVP prompt', 'text', paper);
      add('title', 'RSVP heading', 'text', paper);
      add('action', 'RSVP action', 'text', paper);
    } else if (root.behavior === 'guest-book') {
      add('artwork', 'Book artwork', 'img');
      const copy = add('copy', 'Book copy', 'functional');
      add('subtitle', 'Best wishes prompt', 'text', copy);
      add('title', 'Best wishes heading', 'text', copy);
      add('action', 'Best wishes action', 'text', copy);
    } else if (root.behavior === 'memory-wall') {
      add('artwork', 'Photobooth arch', 'img');
      const frames = add('frames', 'Photo frames', 'functional');
      for (let i = 0; i < Math.min(40, options.frames ?? 6); i++) add(`frame-${i}`, `Photo frame ${i + 1}`, 'img', frames);
      const caption = add('caption', 'Memory caption', 'functional');
      add('title', 'Memory heading', 'text', caption);
      add('subtitle', 'Memory prompt', 'text', caption);
    } else if (root.behavior === 'narrative') {
      add('subtitle', 'Invitation / person label'); add('title', 'Heading / name');
      add('body', 'Invitation / details text');
      if (root.contentKey === 'walimah') { add('date', 'Event date'); add('venue', 'Venue'); }
    }
  }
  return [...byId.values()];
}

/** Keep legacy leaf records for lossless rendering/storage, but expose useful editing units only. */
export function isCinematicEditorLayer(layer: CinematicWorldLayer, root?: CinematicWorldLayer): boolean {
  if (root?.behavior === 'programme-board') return !['artwork', 'copy'].includes(layer.part ?? '') && !/^(row|time|label)-\d+$/.test(layer.part ?? '');
  if (root?.behavior === 'memory-wall') return !/^frame-\d+$/.test(layer.part ?? '');
  return true;
}

export function cinematicEditorLayers(layers: CinematicWorldLayer[]): CinematicWorldLayer[] {
  const visible = layers.filter((layer) => isCinematicEditorLayer(layer, cinematicAncestors(layer, layers).at(-1)));
  const ids = new Set(visible.map((layer) => layer.id));
  return visible.map((layer) => layer.parentId && !ids.has(layer.parentId)
    ? { ...layer, parentId: cinematicAncestors(layer, layers).find((parent) => ids.has(parent.id))?.id }
    : layer);
}

export function cinematicAncestors(layer: CinematicWorldLayer, layers: CinematicWorldLayer[]): CinematicWorldLayer[] {
  const byId = new Map(layers.map((item) => [item.id, item]));
  const seen = new Set([layer.id]); const result: CinematicWorldLayer[] = [];
  let parent = byId.get(layer.parentId ?? '');
  while (parent && !seen.has(parent.id)) {
    result.push(parent); seen.add(parent.id); parent = byId.get(parent.parentId ?? '');
  }
  return result;
}

export function cinematicDescendantIds(id: string, layers: CinematicWorldLayer[]): Set<string> {
  return new Set([id, ...layers.filter((layer) => cinematicAncestors(layer, layers).some((parent) => parent.id === id)).map((layer) => layer.id)]);
}

export function cinematicLayerTree(layers: CinematicWorldLayer[]): { layer: CinematicWorldLayer; depth: number }[] {
  const result: { layer: CinematicWorldLayer; depth: number }[] = []; const seen = new Set<string>();
  const visit = (layer: CinematicWorldLayer, depth: number) => {
    if (seen.has(layer.id)) return;
    seen.add(layer.id); result.push({ layer, depth });
    layers.filter((item) => item.parentId === layer.id).forEach((child) => visit(child, depth + 1));
  };
  layers.filter((layer) => !layer.parentId || !layers.some((item) => item.id === layer.parentId)).forEach((layer) => visit(layer, 0));
  return result;
}
