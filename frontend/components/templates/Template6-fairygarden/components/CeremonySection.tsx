'use client';
import type { AnchorBinding } from '@/components/templates/_shared/hooks/useAnchors';
import { configValue } from '@/components/templates/configValue';
import { motion } from 'framer-motion';
import type { Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import SectionOverlay from '../SectionOverlay';
import styles from '../Template6.module.css';
import { alignClass } from '@/lib/templateUtils';

interface Props {
  customConfig?: Record<string, string>;
  overlayProps: { breakpoint: Breakpoint; config?: Record<string, string>; editor?: EditorHandle };
  anchorProps: AnchorBinding;
}

export default function CeremonySection({ customConfig, overlayProps, anchorProps }: Props) {
  const t = (key: string, fallback: string) => configValue(customConfig, key, fallback);
  const body = t('walimah.body', '');
  const align = alignClass(t('walimah.body.align', 'center'));

  if (!body) return null;

  return (
    <section id="walimah" className={styles.sectionCeremony}>
      <SectionOverlay stageId="walimah" {...overlayProps} />
      <div className={styles.leafBorderTop} aria-hidden="true">🍃</div>

      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h2 className={styles.sectionTitle} {...anchorProps('walimah', 'title')}>
          <span className={styles.titleDecor}>✦</span>
          Ceremony
          <span className={styles.titleDecor}>✦</span>
        </h2>

        <div
          className={`${styles.ceremonyBody} ${align}`}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </motion.div>

      <div className={styles.leafBorderBottom} aria-hidden="true">🍃</div>
    </section>
  );
}
