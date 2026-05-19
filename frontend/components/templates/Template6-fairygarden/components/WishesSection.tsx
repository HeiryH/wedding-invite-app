'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wish, CreateWish } from '@/lib/api';
import styles from '../Template6.module.css';

interface Props {
  wishes: Wish[];
  onSubmitWish: (data: CreateWish) => Promise<void>;
  customConfig?: Record<string, string>;
}

export default function WishesSection({ wishes, onSubmitWish, customConfig }: Props) {
  const t = (key: string, fallback: string) => customConfig?.[key] || fallback;
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitWish({ guestName: name.trim(), message: message.trim() });
      setSubmitted(true);
      setName('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="wishes" className={styles.sectionWishes}>
      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecor}>✦</span>
          Wishes
          <span className={styles.titleDecor}>✦</span>
        </h2>

        <p className={styles.wishPrompt}>{t('wish.prompt', 'Leave a message for the happy couple')}</p>

        <form onSubmit={handleSubmit} className={styles.wishForm}>
          <input
            className={styles.wishInput}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
          />
          <textarea
            className={styles.wishTextarea}
            placeholder="Your heartfelt message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            rows={4}
            required
          />
          <motion.button
            type="submit"
            className={styles.wishBtn}
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? '✨ Sending…' : '✨ Send Wish'}
          </motion.button>
        </form>

        <AnimatePresence>
          {submitted && (
            <motion.div
              className={styles.wishSuccess}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              🌸 Your wish has been received!
            </motion.div>
          )}
        </AnimatePresence>

        {wishes.length > 0 && (
          <div className={styles.wishGrid}>
            {wishes.map((w, i) => (
              <motion.div
                key={w.wishId}
                className={styles.wishCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <p className={styles.wishMessage}>"{w.message}"</p>
                <span className={styles.wishAuthor}>— {w.guestName}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
