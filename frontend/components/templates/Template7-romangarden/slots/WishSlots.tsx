'use client';

import { useState } from 'react';
import { CreateWish } from '@/lib/api';
import type { SlotProps } from '../types';
import styles from '../Template7.module.css';

/**
 * wishes/title.webp is an empty engraved cartouche — a plate meant to hold text, not art with
 * the title baked in. Without this it renders as a conspicuously blank box.
 */
export function WishTitleSlot({ t }: SlotProps) {
  return (
    <div className={styles.plateTitle}>
      <h2>{t('wish.title', 'Wishes & Blessings')}</h2>
    </div>
  );
}

/** Its own layer, not part of the form: inside the form it landed on the ruled card's flourish. */
export function WishPromptSlot({ t }: SlotProps) {
  return (
    <p className={styles.sectionLead} style={{ margin: 0 }}>
      {t('wish.prompt', 'Leave a message for the happy couple')}
    </p>
  );
}

/** The form that sits inside the ruled-card art (wishes/msg.webp — a separate layer). */
export function WishFormSlot({ onSubmitWish, editing }: SlotProps) {
  const [form, setForm] = useState<CreateWish>({ guestName: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) return; // laying out the stage must never post a real wish
    setSubmitting(true);
    try {
      await onSubmitWish(form);
      setForm({ guestName: '', message: '' });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      alert('Failed to submit your wish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.wishCardBody} onSubmit={submit}>
      <input
        className={styles.field}
        placeholder="Your name *"
        required
        value={form.guestName}
        onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
      />
      <textarea
        className={styles.wishTextarea}
        placeholder="Write your wish for the couple…"
        required
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
      />

      {/* The engraved submit-btn art is this button's background, rather than its own layer —
          a separate layer would have to be kept in sync with the button's position forever. */}
      <button type="submit" className={styles.wishSubmit} disabled={submitting}>
        {submitting ? 'Sending…' : sent ? 'Thank you' : 'Send Wish'}
      </button>
    </form>
  );
}

export function WishListSlot({ wishes }: SlotProps) {
  return (
    <div className={styles.wishList}>
      {wishes.length === 0 ? (
        <p className={styles.empty}>No wishes yet — be the first to write one.</p>
      ) : (
        wishes.map((w) => (
          <blockquote key={w.wishId} className={styles.wishItem}>
            <div className={styles.wishFrom}>{w.guestName}</div>
            <p className={styles.wishMsg}>“{w.message}”</p>
          </blockquote>
        ))
      )}
    </div>
  );
}
