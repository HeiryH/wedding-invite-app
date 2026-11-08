'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T1_STAGES, T1_ASSETS } from './data/t1Stages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: T1_ASSETS, assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t1" stages={T1_STAGES} engine={ENGINE} className={styles.overlay} />;
}
