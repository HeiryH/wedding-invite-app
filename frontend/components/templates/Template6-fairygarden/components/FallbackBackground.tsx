'use client';
import { particleSample } from '../data/particles';
import styles from '../Template6.module.css';

export default function FallbackBackground() {
  return (
    <div className={styles.fallbackBg} aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className={styles.fallbackFirefly}
          style={{
            left: `${particleSample(i, 0) * 100}%`,
            top: `${particleSample(i, 1) * 100}%`,
            animationDelay: `${particleSample(i, 2) * 4}s`,
            animationDuration: `${3 + particleSample(i, 3) * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
