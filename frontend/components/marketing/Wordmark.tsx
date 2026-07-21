// The Invit_e brand lockup. Renders "Invit_e" with the gold Great-Vibes "e".
// Self-contained (references the raw font vars) so it can appear on any page,
// not only inside the `.mkt` marketing theme.
const SERIF = 'var(--font-playfair), Georgia, serif';
const SCRIPT = 'var(--font-vibes), cursive';
const SANS = 'var(--font-fredoka), system-ui, sans-serif';
const GOLD = '#e2a23c';

export function Wordmark({
  size = 28,
  stacked = false,
  byline = false,
  ink = '#17130d',
}: {
  size?: number;
  stacked?: boolean;
  byline?: boolean;
  ink?: string;
}) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: stacked ? 'center' : 'flex-start', lineHeight: stacked ? 0.9 : 1 }}>
      {stacked && (
        <span style={{ fontFamily: SERIF, fontWeight: 500, fontSize: size * 0.46, letterSpacing: '0.01em', color: ink }}>
          The
        </span>
      )}
      <span style={{ fontFamily: SERIF, fontWeight: 700, letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'baseline', color: ink, fontSize: size }}>
        <span>{stacked ? 'Invit' : 'The Invit'}</span>
        <span style={{ fontWeight: 400 }}>_</span>
        <span style={{ fontFamily: SCRIPT, fontWeight: 400, color: GOLD, marginLeft: 2, fontSize: size * 1.06 }}>e</span>
      </span>
      {byline && (
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: size * 0.26, marginTop: size * 0.14, color: ink }}>
          by <span style={{ color: GOLD, fontWeight: 600, letterSpacing: '0.04em' }}>ODDSTUDIO</span>
        </span>
      )}
    </span>
  );
}
