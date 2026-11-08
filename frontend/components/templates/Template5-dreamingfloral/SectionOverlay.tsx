'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T5_STAGES, T5_ASSETS } from './data/t5Stages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: T5_ASSETS, assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t5" stages={T5_STAGES} engine={ENGINE} className={styles.overlay} />;
}
