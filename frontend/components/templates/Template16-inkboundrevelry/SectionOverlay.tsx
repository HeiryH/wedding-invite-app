'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T16_STAGES } from './stages';
import styles from './Template16.module.css';

const ENGINE: Engine = { assetRoot: '', assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t16" stages={T16_STAGES} engine={ENGINE} className={styles.overlay} />;
}
