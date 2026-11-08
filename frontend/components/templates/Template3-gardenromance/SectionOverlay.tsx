'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T3_STAGES, T3_ASSETS } from './data/t3Stages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: T3_ASSETS, assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t3" stages={T3_STAGES} engine={ENGINE} className={styles.overlay} />;
}
