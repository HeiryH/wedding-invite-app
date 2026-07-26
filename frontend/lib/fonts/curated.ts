import {
  Playfair_Display,
  Cormorant_Garamond,
  Great_Vibes,
  Dancing_Script,
  Sacramento,
  Parisienne,
  EB_Garamond,
  Cinzel,
  Marcellus,
  Josefin_Sans,
  Quicksand,
  Poppins,
  Raleway,
  Libre_Baskerville,
  Crimson_Text,
  Italiana,
  Bodoni_Moda,
} from 'next/font/google';

/**
 * Curated font registry for the Adjust Editor's text-layer font-family control. Each font gets its
 * own `--font-ae-<key>` CSS variable, loaded once here and put in scope app-wide via
 * `app/layout.tsx`'s `<body>` className — namespaced apart from the app's own chrome fonts
 * (`--font-cormorant` etc.) so this registry stays self-contained regardless of what the app's own
 * fonts do. A curated list (not an open picker) keeps font loading bounded and predictable.
 */
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-playfair', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-cormorant', display: 'swap' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-great-vibes', display: 'swap' });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-dancing-script', display: 'swap' });
const sacramento = Sacramento({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-sacramento', display: 'swap' });
const parisienne = Parisienne({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-parisienne', display: 'swap' });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-eb-garamond', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-cinzel', display: 'swap' });
const marcellus = Marcellus({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-marcellus', display: 'swap' });
const josefinSans = Josefin_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-josefin-sans', display: 'swap' });
const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-quicksand', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-poppins', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-raleway', display: 'swap' });
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-ae-libre-baskerville', display: 'swap' });
const crimsonText = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-ae-crimson-text', display: 'swap' });
const italiana = Italiana({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-italiana', display: 'swap' });
const bodoniModa = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-bodoni-moda', display: 'swap' });

export interface CuratedFont {
  key: string;
  label: string;
  variable: string;
}

export const CURATED_FONTS: CuratedFont[] = [
  { key: 'playfair', label: 'Playfair Display', variable: playfair.variable },
  { key: 'cormorant', label: 'Cormorant Garamond', variable: cormorant.variable },
  { key: 'great-vibes', label: 'Great Vibes', variable: greatVibes.variable },
  { key: 'dancing-script', label: 'Dancing Script', variable: dancingScript.variable },
  { key: 'sacramento', label: 'Sacramento', variable: sacramento.variable },
  { key: 'parisienne', label: 'Parisienne', variable: parisienne.variable },
  { key: 'eb-garamond', label: 'EB Garamond', variable: ebGaramond.variable },
  { key: 'cinzel', label: 'Cinzel', variable: cinzel.variable },
  { key: 'marcellus', label: 'Marcellus', variable: marcellus.variable },
  { key: 'josefin-sans', label: 'Josefin Sans', variable: josefinSans.variable },
  { key: 'quicksand', label: 'Quicksand', variable: quicksand.variable },
  { key: 'poppins', label: 'Poppins', variable: poppins.variable },
  { key: 'raleway', label: 'Raleway', variable: raleway.variable },
  { key: 'libre-baskerville', label: 'Libre Baskerville', variable: libreBaskerville.variable },
  { key: 'crimson-text', label: 'Crimson Text', variable: crimsonText.variable },
  { key: 'italiana', label: 'Italiana', variable: italiana.variable },
  { key: 'bodoni-moda', label: 'Bodoni Moda', variable: bodoniModa.variable },
];

export type CuratedFontKey = (typeof CURATED_FONTS)[number]['key'];

/** All variable class names joined, for `app/layout.tsx`'s `<body className>`. */
export const CURATED_FONT_VARIABLES = CURATED_FONTS.map((f) => f.variable).join(' ');

/**
 * `layer.fontFamily` → a `var(--font-ae-<key>)` reference, or `undefined` to inherit the
 * template's own font.
 *
 * IMPORTANT: this deliberately does NOT use `CuratedFont.variable` — that field is a
 * next/font-generated CSS-*module class name* (e.g. `poppins_8cd37060-module__jIEdma__variable`),
 * meant to be applied via `className` (already done, on `<body>` in app/layout.tsx) so the actual
 * custom property becomes available in that subtree. The custom property's own name is the fixed
 * string this file passed as each font's `variable:` option — reconstructed here by the
 * `--font-ae-<key>` convention every entry follows. Wrapping `.variable` in `var(...)` instead
 * (an earlier version of this function did) produces `var(<mangled-class-name>)`, which never
 * resolves to anything — a real, silent bug caught by inspecting a live-rendered inline style.
 */
export function fontVar(key?: string): string | undefined {
  if (!key) return undefined;
  const font = CURATED_FONTS.find((f) => f.key === key);
  return font ? `var(--font-ae-${font.key})` : undefined;
}
