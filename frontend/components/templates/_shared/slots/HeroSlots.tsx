'use client';

import { useState, useEffect, useMemo, cloneElement } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { toHijriString } from '@/lib/templateUtils';
import { resolveBindings } from '../bindings';
import type { EditorHandle, Layer, SlotProps } from '../types';
import { staggerDelay } from '../reveal';
import { subLayerStyle, subLayersOf } from './subLayerStyle';
import { CurvedPiece, curvedTextOf } from './CurvedPiece';
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

  // Shape (arc/circle) from the Style tab, when this piece's child is one plain string.
  const curveText = curvedTextOf(layer, children);
  const childStyle = (children.props as { style?: CSSProperties }).style ?? {};
  const inner = curveText !== undefined
    ? <CurvedPiece layer={layer!} text={curveText} anim={anim} />
    : cloneElement(children as ReactElement<Record<string, unknown>>, {
      'data-sl-anim': anim,
      'data-scroll-fade': anim === 'scroll-fade' ? true : undefined,
      style: {
        ...childStyle,
        // Style-tab fields (color/font/size/spacing/border/shadow) — present only when the
        // sub-layer is flagged `styleable` (all of these are), so this is a no-op until the
        // couple actually touches the Style tab.
        ...subLayerStyle(layer),
        '--sl-opacity': layer?.opacity ?? 1,
        '--sl-delay': staggerDelay(layer?.order ?? 0),
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

export function CountdownSlot({ wedding, t, stageLayers, layer, editor }: SlotProps) {
  const left = useCountdown(wedding.weddingDate);
  const date = new Date(wedding.weddingDate);
  const showHijri = t('general.showIslamicDate', 'false') === 'true';
  const brideFirst = t('general.brideFirst', 'true') !== 'false';

  const first = brideFirst ? wedding.brideName : wedding.groomName;
  const second = brideFirst ? wedding.groomName : wedding.brideName;
  const firstId = brideFirst ? 'hero-bride' : 'hero-groom';
  const secondId = brideFirst ? 'hero-groom' : 'hero-bride';

  // Resolve the hero's own sub-layer anchors (bride/groom/date/timer) out of the stage's already-
  // resolved siblings — see SlotProps.stageLayers. Template-neutral: works the same whichever
  // template's stage this slot happens to be rendering in.
  const sub = useMemo(
    () => subLayersOf(stageLayers, layer?.id ?? 'countdown'),
    [stageLayers, layer?.id],
  );

  return (
    <div className={styles.heroInner}>
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
 * T10's welcome hero — the same "one slot, several individually adjustable/styleable sub-layers"
 * structure as `CountdownSlot` above (nudge + Style tab per piece via `HeroPiece`, a live countdown
 * timer), just with this template's own content shape: an eyebrow line, an event title, one or two
 * names, date and venue, rather than T7's bride/groom framing. This is the standard STAGE hero
 * structure going forward — a new Stage template's welcome hero should follow this shape (or
 * `CountdownSlot`'s, if "bride & groom" genuinely fits) rather than plain unstructured text layers.
 *
 * Each piece keeps `hasText: true` in the shipped sub-layer (see stages.ts) so the couple can still
 * edit its literal copy (with `{{token}}` insertion) exactly as when these were standalone
 * `kind:'text'` layers — only the position/animation/style now come from a nested sub-layer instead
 * of the layer itself.
 */
export function EventHeroSlot(props: SlotProps) {
  const { wedding, stageLayers, layer, editor } = props;
  const left = useCountdown(wedding.weddingDate);

  const sub = useMemo(
    () => subLayersOf(stageLayers, layer?.id ?? 'hero'),
    [stageLayers, layer?.id],
  );

  const text = (id: string, fallback: string) => resolveBindings(sub[id]?.text ?? fallback, props);

  return (
    <div className={styles.eventHero}>
      <HeroPiece layer={sub['hero-eyebrow']} editor={editor} id="hero-eyebrow">
        <p className={styles.heroEyebrow}>{text('hero-eyebrow', "You're invited to")}</p>
      </HeroPiece>
      <HeroPiece layer={sub['hero-title']} editor={editor} id="hero-title">
        <p className={styles.heroTitle}>{text('hero-title', '{{eventTitle}}')}</p>
      </HeroPiece>
      <HeroPiece layer={sub['hero-names']} editor={editor} id="hero-names">
        <p className={styles.heroNames}>{text('hero-names', '{{name1}} & {{name2}}')}</p>
      </HeroPiece>
      <HeroPiece layer={sub['hero-date']} editor={editor} id="hero-date">
        <p className={styles.heroDateLine}>{text('hero-date', '{{date:long}}')}</p>
      </HeroPiece>
      <HeroPiece layer={sub['hero-venue']} editor={editor} id="hero-venue">
        <p className={styles.heroVenueLine}>{text('hero-venue', '{{venue}}')}</p>
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

/** Just the date, split out of `CountdownSlot` for the authoring catalog (an authored template
 *  can drop this in alone rather than the whole bundled hero). Its own component because "show
 *  the Hijri date" is a conditional a plain text layer can't express. */
export function HeroDateSlot({ wedding, t }: SlotProps) {
  const date = new Date(wedding.weddingDate);
  const showHijri = t('general.showIslamicDate', 'false') === 'true';
  return (
    <div className={styles.heroDate}>
      <p className={styles.weddingDate}>
        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      {showHijri && <p className={styles.hijriDate}>{toHijriString(date)}</p>}
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
