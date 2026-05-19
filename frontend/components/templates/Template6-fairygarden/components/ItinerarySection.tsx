'use client';
import { motion } from 'framer-motion';
import { ItineraryItem } from '@/lib/api';
import styles from '../Template6.module.css';

interface Props {
  items: ItineraryItem[];
}

export default function ItinerarySection({ items }: Props) {
  if (!items.length) return null;

  return (
    <section id="itinerary" className={styles.sectionItinerary}>
      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecor}>✦</span>
          Programme
          <span className={styles.titleDecor}>✦</span>
        </h2>

        <ol className={styles.itineraryList}>
          {items.map((item, i) => (
            <motion.li
              key={item.itineraryItemId}
              className={styles.itineraryItem}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <span className={styles.itineraryDot}>🌸</span>
              <div className={styles.itineraryText}>
                <span className={styles.itineraryLabel}>{item.label}</span>
                {item.detail && <span className={styles.itineraryDetail}>{item.detail}</span>}
              </div>
            </motion.li>
          ))}
        </ol>
      </motion.div>
    </section>
  );
}
