'use client';
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Wedding } from '@/lib/api';
import { WebGLCapability } from '../hooks/useWebGLSupport';
import { FairyConfig } from '../hooks/useFairyConfig';
import FallbackBackground from './FallbackBackground';
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
}

export default function WelcomeSection({
  wedding,
  config,
  webgl,
  reduced,
  customConfig,
  showIslamicDate,
  onScrollDown,
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
        <motion.span
          className={styles.enchantmentBadge}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          ✦ {config.enchantmentLabel} ✦
        </motion.span>

        <motion.p
          className={`${styles.fireflyGreeting} ${alignClass(t('invite.heading.align', 'center'))}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
        >
          {config.fireflyGreeting}
        </motion.p>

        <motion.h1
          className={`${styles.coupleNames} ${alignClass(t('invite.heading.align', 'center'))}`}
          style={headingStyle(customConfig ?? {})}
          {...headingAnimationProps(customConfig ?? {})}
        >
          {wedding.brideName}
          <span className={styles.ampersand}>&</span>
          {wedding.groomName}
        </motion.h1>

        <motion.div
          className={styles.headingMessage}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          dangerouslySetInnerHTML={{ __html: t('invite.heading', 'Together with their families') }}
        />

        <motion.div
          className={styles.dateVenue}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
        >
          <div className={styles.dateDisplay}>
            <span className={styles.dateMain}>{dateStr}</span>
            {hijriStr && <span className={styles.dateHijri}>{hijriStr}</span>}
          </div>
          <div className={styles.venueDivider}>✦</div>
          <div className={styles.venueDisplay}>
            <span className={styles.venueName}>{wedding.venue}</span>
            {wedding.venueAddress && (
              <span className={styles.venueAddress}>{wedding.venueAddress}</span>
            )}
          </div>
        </motion.div>

        <motion.div
          className={styles.inviteBody}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          dangerouslySetInnerHTML={{
            __html: t('invite.body', 'We joyfully invite you to share in the celebration of our wedding'),
          }}
        />

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
