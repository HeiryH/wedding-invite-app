'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T4_STAGES, T4_ASSETS } from './data/t4Stages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: T4_ASSETS, assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t4" stages={T4_STAGES} engine={ENGINE} className={styles.overlay} />;
}
