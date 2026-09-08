export interface CuratedFont {
  key: string;
  label: string;
}

/**
 * Curated font registry for the Adjust Editor's text-layer font-family control — pure metadata,
 * no `next/font` import. The actual `next/font/google` loader calls live in `./curated.ts`, kept
 * in a separate module so importing this file (or `fontVar`) never drags all 19 font files into a
 * page's module graph — `next/font`'s preload-header generation is driven by module-graph
 * membership, not by whether a class is applied, so only `app/layout.tsx` should import
 * `curated.ts`. A curated list (not an open picker) keeps font loading bounded and predictable.
 */
export const CURATED_FONTS: CuratedFont[] = [
  { key: 'playfair', label: 'Playfair Display' },
  { key: 'cormorant', label: 'Cormorant Garamond' },
  { key: 'great-vibes', label: 'Great Vibes' },
  { key: 'dancing-script', label: 'Dancing Script' },
  { key: 'sacramento', label: 'Sacramento' },
  { key: 'parisienne', label: 'Parisienne' },
  { key: 'eb-garamond', label: 'EB Garamond' },
  { key: 'cinzel', label: 'Cinzel' },
  { key: 'marcellus', label: 'Marcellus' },
  { key: 'josefin-sans', label: 'Josefin Sans' },
  { key: 'quicksand', label: 'Quicksand' },
  { key: 'poppins', label: 'Poppins' },
  { key: 'raleway', label: 'Raleway' },
  { key: 'libre-baskerville', label: 'Libre Baskerville' },
  { key: 'crimson-text', label: 'Crimson Text' },
  { key: 'italiana', label: 'Italiana' },
  { key: 'bodoni-moda', label: 'Bodoni Moda' },
  { key: 'baloo-2', label: 'Baloo 2' },
  { key: 'nunito', label: 'Nunito' },
];

export type CuratedFontKey = (typeof CURATED_FONTS)[number]['key'];

/**
 * `layer.fontFamily` → a `var(--font-ae-<key>)` reference, or `undefined` to inherit the
 * template's own font.
 *
 * IMPORTANT: this deliberately does NOT reference a next/font `variable` (a mangled CSS-module
 * class name meant for `className`, not `var()`) — it reconstructs the CSS custom property's name
 * directly from the fixed `--font-ae-<key>` convention every entry in `curated.ts` follows.
 * Wrapping a `.variable` value in `var(...)` instead (an earlier version of this function did)
 * produces `var(<mangled-class-name>)`, which never resolves to anything — a real, silent bug
 * caught by inspecting a live-rendered inline style.
 */
export function fontVar(key?: string): string | undefined {
  if (!key) return undefined;
  const font = CURATED_FONTS.find((f) => f.key === key);
  return font ? `var(--font-ae-${font.key})` : undefined;
}
