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
  Baloo_2,
  Nunito,
} from 'next/font/google';
import type { CuratedFontKey } from './registry';

/**
 * next/font/google loader calls for the curated registry (`./registry.ts`). Kept in a separate
 * module from the pure key/label metadata + `fontVar()` helper so importing font *metadata* (the
 * Adjust panel's font picker, or `fontVar` itself) never drags all 19 font files into a page's
 * module graph — only `app/layout.tsx` imports this file, for `CURATED_FONT_VARIABLES`.
 *
 * `preload: true` is reserved for the fonts a shipped template defaults to, so its first paint is
 * crisp with no font swap: `cinzel`/`cormorant`/`eb-garamond` (Template 7), `baloo-2`/`nunito`
 * (Template 10). Every other curated font is `preload: false` — still available the moment a page
 * references its `--font-ae-<key>` variable (`display: 'swap'` is set on all of them), just not
 * downloaded up front. This is what keeps the invite route's `Link: rel=preload` response header
 * small: a prior version preloaded all 19 fonts app-wide regardless of which template/couple ever
 * used them, which grew a ~4.4KB header (34 files) that exceeded nginx's proxy buffer and took
 * production down with `upstream sent too big header` — see docs/FIX_QUEUE.md Issue 4. Adding a new
 * curated font should default to `preload: false` unless it becomes a new template's own default.
 */
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-playfair', display: 'swap', preload: false });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-cormorant', display: 'swap', preload: true });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-great-vibes', display: 'swap', preload: false });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-dancing-script', display: 'swap', preload: false });
const sacramento = Sacramento({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-sacramento', display: 'swap', preload: false });
const parisienne = Parisienne({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-parisienne', display: 'swap', preload: false });
const ebGaramond = EB_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-eb-garamond', display: 'swap', preload: true });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-cinzel', display: 'swap', preload: true });
const marcellus = Marcellus({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-marcellus', display: 'swap', preload: false });
const josefinSans = Josefin_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-josefin-sans', display: 'swap', preload: false });
const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-quicksand', display: 'swap', preload: false });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-poppins', display: 'swap', preload: false });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-raleway', display: 'swap', preload: false });
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-ae-libre-baskerville', display: 'swap', preload: false });
const crimsonText = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-ae-crimson-text', display: 'swap', preload: false });
const italiana = Italiana({ subsets: ['latin'], weight: ['400'], variable: '--font-ae-italiana', display: 'swap', preload: false });
const bodoniModa = Bodoni_Moda({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-ae-bodoni-moda', display: 'swap', preload: false });
// Chunky, hand-drawn-feeling rounded faces for Template 10 (Sunny Safari) — the registry was
// entirely wedding-elegant serifs/scripts before this, nothing close to a crayon-marker headline.
const baloo2 = Baloo_2({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-ae-baloo-2', display: 'swap', preload: true });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-ae-nunito', display: 'swap', preload: true });

/**
 * Every `CuratedFontKey` (registry.ts) mapped to its loader — the `Record<CuratedFontKey, ...>`
 * type means TypeScript fails the build if a key is ever added to the registry without a matching
 * loader here (or vice versa), so the two files can't silently drift apart.
 */
const FONT_LOADERS: Record<CuratedFontKey, { variable: string }> = {
  playfair,
  cormorant,
  'great-vibes': greatVibes,
  'dancing-script': dancingScript,
  sacramento,
  parisienne,
  'eb-garamond': ebGaramond,
  cinzel,
  marcellus,
  'josefin-sans': josefinSans,
  quicksand,
  poppins,
  raleway,
  'libre-baskerville': libreBaskerville,
  'crimson-text': crimsonText,
  italiana,
  'bodoni-moda': bodoniModa,
  'baloo-2': baloo2,
  nunito,
};

/** All variable class names joined, for `app/layout.tsx`'s `<body className>`. */
export const CURATED_FONT_VARIABLES = Object.values(FONT_LOADERS)
  .map((f) => f.variable)
  .join(' ');
