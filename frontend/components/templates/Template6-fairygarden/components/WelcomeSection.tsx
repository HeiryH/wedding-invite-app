'use client';
import { Suspense, lazy, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Wedding } from '@/lib/api';
import type { AnimIdleType, Breakpoint, EditorHandle } from '@/components/templates/_shared/types';
import { WebGLCapability } from '../hooks/useWebGLSupport';
import { FairyConfig } from '../hooks/useFairyConfig';
import FallbackBackground from './FallbackBackground';
import SectionOverlay from '../SectionOverlay';
import styles from '../Template6.module.css';
import { toHijriString, alignClass, headingStyle, headingAnimationProps } from '@/lib/templateUtils';

const FairyGardenScene = lazy(() => import('../scenes/FairyGardenScene'));

interface Props {
  wedding: Wedding;
  config: FairyConfig;
  webgl: WebGLCapability;
  reduced: boolean;
  customConfig?: Record<string, string>;
  showIslamicDate: boolean;
  onScrollDown: () => void;
  overlayProps: { breakpoint: Breakpoint; config?: Record<string, string>; editor?: EditorHandle };
  a: (stageId: string, elementId: string, base?: CSSProperties) => CSSProperties;
  tx: (stageId: string, elementId: string, fallback: string) => string;
  sx: (stageId: string, elementId: string) => CSSProperties;
  ax: (stageId: string, elementId: string) => { 'data-sl-idle'?: AnimIdleType; style?: CSSProperties };
}

export default function WelcomeSection({
  wedding,
  config,
  webgl,
  reduced,
  customConfig,
  showIslamicDate,
  onScrollDown,
  overlayProps,
  a,
  tx,
  sx,
  ax,
}: Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const sceneOff = config.quality === 'off' || webgl === 'none';
  const weddingDate = new Date(wedding.weddingDate);

  const dateStr = weddingDate.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hijriStr = showIslamicDate ? toHijriString(weddingDate) : null;

  return (
    <section id="welcome" className={styles.sectionWelcome}>
      <SectionOverlay stageId="welcome" {...overlayProps} />
      {/* 3D layer */}
      <div className={styles.canvasLayer}>
        {sceneOff ? (
          <FallbackBackground />
        ) : (
          <Suspense fallback={<FallbackBackground />}>
            <FairyGardenScene config={config} reduced={reduced} />
          </Suspense>
        )}
      </div>

      {/* Forest overlay gradient */}
      <div className={styles.forestOverlay} aria-hidden="true" />

      {/* Content */}
      <div className={styles.welcomeContent}>
        <div style={a('welcome', 'badge')}>
          <motion.span
            className={styles.enchantmentBadge}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            ✦ {config.enchantmentLabel} ✦
          </motion.span>
        </div>

        <div style={a('welcome', 'greeting')}>
          <motion.p
            className={`${styles.fireflyGreeting} ${alignClass(t('invite.heading.align', 'center'))}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.9 }}
          >
            {config.fireflyGreeting}
          </motion.p>
        </div>

        <div style={a('welcome', 'names')} data-seen="true">
          <motion.h1
            className={`${styles.coupleNames} ${alignClass(t('invite.heading.align', 'center'))}`}
            style={{ ...headingStyle(customConfig ?? {}), ...sx('welcome', 'names') }}
            {...headingAnimationProps(customConfig ?? {})}
          >
            <span {...ax('welcome', 'names')}>{wedding.brideName}</span>
            <span className={styles.ampersand} style={sx('welcome', 'connector')}>
              <span {...ax('welcome', 'connector')}>{tx('welcome', 'connector', '&')}</span>
            </span>
            <span {...ax('welcome', 'names')}>{wedding.groomName}</span>
          </motion.h1>
        </div>

        <div style={a('welcome', 'message')}>
          <motion.div
            className={styles.headingMessage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            dangerouslySetInnerHTML={{ __html: t('invite.heading', 'Together with their families') }}
          />
        </div>

        <div style={a('welcome', 'dateVenue')}>
          <motion.div
            className={styles.dateVenue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
          >
            <div className={styles.dateDisplay} style={a('welcome', 'date')}>
              <span className={styles.dateMain}>{dateStr}</span>
              {hijriStr && <span className={styles.dateHijri}>{hijriStr}</span>}
            </div>
            <div className={styles.venueDivider}>✦</div>
            <div className={styles.venueDisplay} style={a('welcome', 'venue')}>
              <span className={styles.venueName}>{wedding.venue}</span>
              {wedding.venueAddress && (
                <span className={styles.venueAddress}>{wedding.venueAddress}</span>
              )}
            </div>
          </motion.div>
        </div>

        <div style={a('welcome', 'inviteBody')}>
          <motion.div
            className={styles.inviteBody}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            dangerouslySetInnerHTML={{
              __html: t('invite.body', 'We joyfully invite you to share in the celebration of our wedding'),
            }}
          />
        </div>

        {/* Excluded from anchoring: continuous repeat:Infinity bounce never settles. */}
        <motion.button
          className={styles.scrollCue}
          onClick={onScrollDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ delay: 2, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          aria-label="Scroll to explore"
        >
          <span className={styles.scrollLeaf}>🌿</span>
        </motion.button>
      </div>
    </section>
  );
}
