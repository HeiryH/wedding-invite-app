'use client';
import SharedSectionOverlay, { type SectionOverlayProps } from '@/components/templates/_shared/SectionOverlay';
import type { Engine } from '@/components/templates/_shared/engine';
import { T6_STAGES, T6_ASSETS } from './data/t6Stages';
import styles from './SectionOverlay.module.css';

const ENGINE: Engine = { assetRoot: T6_ASSETS, assetSizes: {}, slotRegistry: {} };

export default function SectionOverlay(props: SectionOverlayProps) {
  return <SharedSectionOverlay {...props} prefix="t6" stages={T6_STAGES} engine={ENGINE} className={styles.overlay} />;
}
