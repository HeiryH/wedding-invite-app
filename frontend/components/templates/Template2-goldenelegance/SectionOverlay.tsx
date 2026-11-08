'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T2_STAGES, T2_ASSETS } from './data/t2Stages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: T2_ASSETS, assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t2" stages={T2_STAGES} engine={ENGINE} className={styles.overlay} />;
}
