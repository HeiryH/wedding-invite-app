'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T11_STAGES, SHIPPED_PROP_IDS } from './data/roseHorizonStages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: '/templates/rose-horizon', assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t11" stages={T11_STAGES} engine={ENGINE} className={styles.overlay} stageAttributes={false} excludeSlots shippedProps={SHIPPED_PROP_IDS} />;
}
