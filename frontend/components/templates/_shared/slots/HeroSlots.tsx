'use client';
import { formatEventDate } from '@/lib/eventDateFormat';
import { useCountdown } from '@/components/templates/_shared/hooks/useCountdown';

import { useMemo } from 'react';
import { toHijriString } from '@/lib/templateUtils';
import { resolveBindings } from '../bindings';
import type { SlotProps } from '../types';
import { subLayersOf } from './subLayerStyle';
import { SlotPiece } from './SlotPiece';
import styles from './slots.module.css';

export function CountdownSlot({ wedding, t, stageLayers, layer, editor }: SlotProps) {
  const left = useCountdown(wedding.weddingDate);
  const date = new Date(wedding.weddingDate);
  const showHijri = t('general.showIslamicDate', 'false') === 'true';
  const brideFirst = t('general.brideFirst', 'true') !== 'false';

  const first = brideFirst ? wedding.brideName : wedding.groomName;
  const second = brideFirst ? wedding.groomName : wedding.brideName;
  const firstId = brideFirst ? 'hero-bride' : 'hero-groom';
  const secondId = brideFirst ? 'hero-groom' : 'hero-bride';

  const units = useMemo(() => subLayersOf(stageLayers, 'hero-timer'), [stageLayers]);
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
        <SlotPiece stageId="welcome" layer={sub[firstId]} editor={editor} id={firstId}>
          <span>{first}</span>
        </SlotPiece>
        <span className={styles.amp}>and</span>
        <SlotPiece stageId="welcome" layer={sub[secondId]} editor={editor} id={secondId}>
          <span>{second}</span>
        </SlotPiece>
      </h1>

      <div className={styles.fleuron}>❦</div>

      <SlotPiece stageId="welcome" layer={sub['hero-date']} editor={editor} id="hero-date">
        <div className={styles.heroDate}>
          <p className={styles.weddingDate}>
            {formatEventDate(date, 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {showHijri && <p className={styles.hijriDate}>{toHijriString(date)}</p>}
        </div>
      </SlotPiece>

      {left && (
        <SlotPiece stageId="welcome" layer={sub['hero-timer']} editor={editor} id="hero-timer">
          <div className={styles.countdown}>
            {/* Each unit is a sub-layer of `hero-timer` — nudge/restyle/back/hide one at a time
                while the group still moves them together. A template opts in by declaring
                `hero-timer-{days,hours,min,sec}` with `parent: 'hero-timer'` in its stage data. */}
            {([
              ['hero-timer-days', 'Days', left.days],
              ['hero-timer-hours', 'Hrs', left.hours],
              ['hero-timer-min', 'Min', left.minutes],
              ['hero-timer-sec', 'Sec', left.seconds],
            ] as const).map(([pid, label, val]) => (
              <SlotPiece stageId="welcome" key={pid} layer={units[pid]} editor={editor} id={pid}>
                <div className={styles.countUnit}>
                  <span className={styles.countNum}>{String(val).padStart(2, '0')}</span>
                  <span className={styles.countLabel}>{units[pid]?.text ?? label}</span>
                </div>
              </SlotPiece>
            ))}
          </div>
        </SlotPiece>
      )}
    </div>
  );
}

/**
 * T10's welcome hero — the same "one slot, several individually adjustable/styleable sub-layers"
 * structure as `CountdownSlot` above (nudge + Style tab per piece via `SlotPiece`, a live countdown
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
  const units = useMemo(() => subLayersOf(stageLayers, 'hero-timer'), [stageLayers]);

  const text = (id: string, fallback: string) => resolveBindings(sub[id]?.text ?? fallback, props);

  return (
    <div className={styles.eventHero}>
      <SlotPiece stageId="welcome" layer={sub['hero-eyebrow']} editor={editor} id="hero-eyebrow">
        <p className={styles.heroEyebrow}>{text('hero-eyebrow', "You're invited to")}</p>
      </SlotPiece>
      <SlotPiece stageId="welcome" layer={sub['hero-title']} editor={editor} id="hero-title">
        <p className={styles.heroTitle}>{text('hero-title', '{{eventTitle}}')}</p>
      </SlotPiece>
      <SlotPiece stageId="welcome" layer={sub['hero-names']} editor={editor} id="hero-names">
        <p className={styles.heroNames}>{text('hero-names', '{{name1}} & {{name2}}')}</p>
      </SlotPiece>
      <SlotPiece stageId="welcome" layer={sub['hero-date']} editor={editor} id="hero-date">
        <p className={styles.heroDateLine}>{text('hero-date', '{{date:long}}')}</p>
      </SlotPiece>
      <SlotPiece stageId="welcome" layer={sub['hero-venue']} editor={editor} id="hero-venue">
        <p className={styles.heroVenueLine}>{text('hero-venue', '{{venue}}')}</p>
      </SlotPiece>
      {left && (
        <SlotPiece stageId="welcome" layer={sub['hero-timer']} editor={editor} id="hero-timer">
          <div className={styles.countdown}>
            {/* Each unit is a sub-layer of `hero-timer` — nudge/restyle/back/hide one at a time
                while the group still moves them together. A template opts in by declaring
                `hero-timer-{days,hours,min,sec}` with `parent: 'hero-timer'` in its stage data. */}
            {([
              ['hero-timer-days', 'Days', left.days],
              ['hero-timer-hours', 'Hrs', left.hours],
              ['hero-timer-min', 'Min', left.minutes],
              ['hero-timer-sec', 'Sec', left.seconds],
            ] as const).map(([pid, label, val]) => (
              <SlotPiece stageId="welcome" key={pid} layer={units[pid]} editor={editor} id={pid}>
                <div className={styles.countUnit}>
                  <span className={styles.countNum}>{String(val).padStart(2, '0')}</span>
                  <span className={styles.countLabel}>{units[pid]?.text ?? label}</span>
                </div>
              </SlotPiece>
            ))}
          </div>
        </SlotPiece>
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
        {formatEventDate(date, 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
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
