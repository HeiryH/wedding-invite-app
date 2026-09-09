import { ROSE_HORIZON_PROPS, PROP_DEPTH } from './data/roseHorizonProps';
import type { SectionCode } from '@/lib/templateUtils';
import styles from './Template11.module.css';

/**
 * Renders this section's decorative art (roses, icons, the welcome arch) at the positions
 * `ingest` measured off the human-approved Recraft design — see docs/rose-horizon-props/.
 *
 * Not couple-editable via the Adjust dock: SectionOverlay's decorative-layer system is built
 * for layers the couple adds themselves (ships with none by default, per every other Classic
 * template). There's no existing mechanism for a template to ship its OWN default decorative
 * art through that system, so this renders directly instead. Known gap, not an oversight --
 * worth folding back as a real engine capability if a future template wants the same thing.
 *
 * `data-depth` + `useParallax` (called by the parent template) is the SAME shared mechanism
 * every other template's decorative/anchor layers already use -- not a bespoke one-off.
 */
export function PropLayer({ section }: { section: SectionCode }) {
  const props = ROSE_HORIZON_PROPS[section] ?? [];
  return (
    <>
      {props.map((p) => (
        <img
          key={p.id}
          src={p.src}
          alt=""
          draggable={false}
          data-depth={PROP_DEPTH}
          className={styles.prop}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.w}%`,
            height: `${p.h}%`,
          }}
        />
      ))}
    </>
  );
}
