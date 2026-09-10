'use client';
import type { CSSProperties } from 'react';
import styles from './TemplateNav.module.css';

export type NavLayout = 'bottom-pill' | 'top-pill' | 'bottom-bar' | 'hidden';

interface Props {
  items: { id: string; label: string }[];
  active: string;
  onNav: (id: string) => void;
  /** `nav.layout` (templateConfigSchema.ts). Defaults to 'bottom-pill' — every template's
   *  historical, only-ever-shipped shape — so an omitted prop renders unchanged. */
  layout?: NavLayout;
  /** CSS custom properties this template supplies for its theme (colours, font, radius, the
   *  nav.size/nav.textSize scale multipliers) — same pattern as `--slot-*` in engine.tsx/index.tsx.
   *  T7 and T10 each set a full token set inline at their mount site so their look is unchanged by
   *  this component's extraction; a template that sets none gets this file's plain neutral
   *  defaults (see the `var(--nav-*, <fallback>)` values below). */
  vars?: CSSProperties;
}

/**
 * Template-neutral bottom/top nav pill, shared by every Stage-family template (T7, T10 today).
 * Was two byte-identical `NavBar.tsx` components differing only in which CSS module they imported
 * — consolidated here so `nav.layout` (bottom-pill / top-pill / bottom-bar / hidden) is written
 * once. Structural/positional CSS lives in `TemplateNav.module.css`; all theming (colour, font,
 * radius, backdrop, the nav.size/nav.textSize scale factors) comes in via the `vars` custom
 * properties, exactly like the slot catalog's `--slot-*` tokens.
 */
export default function TemplateNav({ items, active, onNav, layout = 'bottom-pill', vars }: Props) {
  if (layout === 'hidden') return null;
  return (
    <nav
      className={`${styles.nav} ${styles[layoutVariant(layout)]}`}
      style={vars}
      aria-label="Sections"
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`${styles.navBtn} ${active === item.id ? styles.navActive : ''}`}
          onClick={() => onNav(item.id)}
          aria-current={active === item.id ? 'true' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function layoutVariant(layout: NavLayout): 'bottomPill' | 'topPill' | 'bottomBar' {
  if (layout === 'top-pill') return 'topPill';
  if (layout === 'bottom-bar') return 'bottomBar';
  return 'bottomPill';
}
