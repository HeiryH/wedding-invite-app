'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { SHIPPED_PROP_IDS, T12_STAGES } from './data/dreamyWoodlandStages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: '/templates/dreamy-woodland', assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t12" stages={T12_STAGES} engine={ENGINE} className={styles.overlay} stageAttributes={false} excludeSlots shippedProps={SHIPPED_PROP_IDS} eager={props.stageId === 'welcome'} />;
}
