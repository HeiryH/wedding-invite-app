'use client';
import styles from '../Template6.module.css';

export default function FallbackBackground() {
  return (
    <div className={styles.fallbackBg} aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className={styles.fallbackFirefly}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
