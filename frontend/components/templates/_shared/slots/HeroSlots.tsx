'use client';

import { useState, useEffect, useMemo, cloneElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { toHijriString } from '@/lib/templateUtils';
import { resolveStage } from '@/components/templates/_shared/layout';
import type { EditorHandle, Layer, SlotProps } from '../types';
// CountdownSlot's hero sub-layer nudges (theme/bride/groom/date/timer) are still T7's own —
// generalizing per-slot sub-layer authoring to arbitrary templates is out of scope for the slot
// catalog extraction. Safe as a shared default: T7's own shipped hero-* anchors resolve to
// identity (x:50,y:50,s:1, i.e. "no nudge") when there's no t7.layout.* override, so an authored
// template harmlessly inherits a no-op here rather than a visible T7-specific position.
import { T7_STAGES } from '../../Template7-romangarden/data/stages';
import styles from './slots.module.css';

/** Returns null once the date has passed, so the hero never shows a dead 00:00:00. */
function useCountdown(target: string) {
  const [left, setLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return setLeft(null);
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

/**
 * Wraps a hero element as an adjustable sub-layer: the nudge (translate/scale) rides an outer
 * wrapper while the reveal animation (`data-sl-anim` + reveal.css, triggered by the enclosing
 * stage's `data-seen`) rides the element itself — two elements so the two transforms never fight.
 */
function HeroPiece({ layer, editor, id, children }: {
  layer?: Layer;
  editor?: EditorHandle;
  id: string;
  children: ReactElement;
}) {
  if (layer?.hidden) return null;

  const dx = (layer?.x ?? 50) - 50;
  const dy = (layer?.y ?? 50) - 50;
  const s = layer?.s ?? 1;
  const nudge = dx || dy || s !== 1 ? `translate(${dx}%, ${dy}%) scale(${s})` : undefined;
  const anim = layer?.anim || 'rise';
  const animOut = layer?.animOut && layer.animOut !== 'none' ? layer.animOut : undefined;
  const selected =
    Boolean(editor?.enabled) && editor?.selectedStage === 'welcome' && editor?.selectedLayer === id;

  const childStyle = (children.props as { style?: CSSProperties }).style ?? {};
  const inner = cloneElement(children as ReactElement<Record<string, unknown>>, {
    'data-sl-anim': anim,
    'data-scroll-fade': anim === 'scroll-fade' ? true : undefined,
    style: {
      ...childStyle,
      '--sl-opacity': layer?.opacity ?? 1,
      '--sl-delay': `${0.35 + (layer?.order ?? 0) * 0.22}s`,
      ...(layer?.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
    } as CSSProperties,
  });

  // nudge wrapper · optional exit wrapper (scroll-scrubbed via --sl-out) · entrance inner — three
  // elements so nudge/exit/entrance transforms never collide.
  return (
    <div
      style={{
        transform: nudge,
        ...(selected ? { outline: '2px dashed #C98A54', outlineOffset: '3px' } : {}),
      }}
    >
      {animOut ? (
        <div data-scroll-exit data-sl-out={animOut}>{inner}</div>
      ) : (
        inner
      )}
    </div>
  );
}

export function CountdownSlot({ wedding, t, config, breakpoint, editor }: SlotProps) {
  const left = useCountdown(wedding.weddingDate);
  const date = new Date(wedding.weddingDate);
  const showHijri = t('general.showIslamicDate', 'false') === 'true';
  const brideFirst = t('general.brideFirst', 'true') !== 'false';

  const first = brideFirst ? wedding.brideName : wedding.groomName;
  const second = brideFirst ? wedding.groomName : wedding.brideName;
  const firstId = brideFirst ? 'hero-bride' : 'hero-groom';
  const secondId = brideFirst ? 'hero-groom' : 'hero-bride';

  // Resolve the hero's sub-layer anchors (theme/bride/groom/date/timer) from the couple's saved
  // deltas — falls back to the shipped defaults (staggered order 0..4) when there's no config.
  const sub = useMemo(() => {
    const layers = resolveStage('t7', T7_STAGES.welcome, breakpoint ?? 'mobile', config).layers;
    const map: Record<string, Layer> = {};
    for (const l of layers) if (l.parent === 'countdown') map[l.id] = l;
    return map;
  }, [config, breakpoint]);

  return (
    <div className={styles.heroInner}>
      <HeroPiece layer={sub['hero-theme']} editor={editor} id="hero-theme">
        <p className={styles.themeLabel}>{t('invite.theme_label', 'Roman Garden')}</p>
      </HeroPiece>

      <h1 className={styles.coupleNames}>
        <HeroPiece layer={sub[firstId]} editor={editor} id={firstId}>
          <span>{first}</span>
        </HeroPiece>
        <span className={styles.amp}>and</span>
        <HeroPiece layer={sub[secondId]} editor={editor} id={secondId}>
          <span>{second}</span>
        </HeroPiece>
      </h1>

      <div className={styles.fleuron}>❦</div>

      <HeroPiece layer={sub['hero-date']} editor={editor} id="hero-date">
        <div className={styles.heroDate}>
          <p className={styles.weddingDate}>
            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {showHijri && <p className={styles.hijriDate}>{toHijriString(date)}</p>}
        </div>
      </HeroPiece>

      {left && (
        <HeroPiece layer={sub['hero-timer']} editor={editor} id="hero-timer">
          <div className={styles.countdown}>
            {([
              ['Days', left.days],
              ['Hrs', left.hours],
              ['Min', left.minutes],
              ['Sec', left.seconds],
            ] as const).map(([label, val]) => (
              <div key={label} className={styles.countUnit}>
                <span className={styles.countNum}>{String(val).padStart(2, '0')}</span>
                <span className={styles.countLabel}>{label}</span>
              </div>
            ))}
          </div>
        </HeroPiece>
      )}
    </div>
  );
}

/**
 * Just the countdown timer grid — no theme label, no couple names, no date. `CountdownSlot`
 * bundles all of those (T7's original hero composition, complete with a hardcoded "Roman Garden"
 * theme-label default and T7-specific hero-* sub-layer anchors), which is wrong for any other
 * authored template: dropping it in showed literal "ROMAN GARDEN" branding on an unrelated
 * template. This slot lets a welcome stage be composed instead from primitive, data-bound text
 * layers (see bindings.ts) for the heading/names/date, plus just the live timer here.
 */
export function TimerSlot({ wedding }: SlotProps) {
  const left = useCountdown(wedding.weddingDate);
  if (!left) return null;
  return (
    <div className={styles.countdown} style={{ justifyContent: 'center', height: '100%', alignItems: 'center' }}>
      {([
        ['Days', left.days],
        ['Hrs', left.hours],
        ['Min', left.minutes],
        ['Sec', left.seconds],
      ] as const).map(([label, val]) => (
        <div key={label} className={styles.countUnit}>
          <span className={styles.countNum}>{String(val).padStart(2, '0')}</span>
          <span className={styles.countLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function ScrollCueSlot() {
  const next = () => {
    const stages = Array.from(document.querySelectorAll('[data-stage]'));
    stages[1]?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <button className={styles.scrollCue} onClick={next} aria-label="Scroll to the next section">
      Enter
      <span>↓</span>
    </button>
  );
}
