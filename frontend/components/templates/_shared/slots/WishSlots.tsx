'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreateWish } from '@/lib/api';
import type { SlotProps } from '../types';
import styles from './slots.module.css';

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

/**
 * The message field is always visible but starts collapsed to one line; focusing it expands the
 * card and slides in the name field + submit button — ported from Template5.tsx's own wish form
 * (a lighter-weight ask than showing every field up front). Sits inside the ruled-card art
 * (wishes/msg.webp — a separate layer) same as before.
 */
export function WishFormSlot({ onSubmitWish, editing }: SlotProps) {
  const [form, setForm] = useState<CreateWish>({ guestName: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) return; // laying out the stage must never post a real wish
    setSubmitting(true);
    try {
      await onSubmitWish(form);
      setForm({ guestName: '', message: '' });
      setSent(true);
      setExpanded(false);
      setTimeout(() => setSent(false), 3000);
    } catch {
      alert('Failed to submit your wish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className={styles.wishCardBody}
      onSubmit={submit}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setExpanded(false); }}
    >
      <textarea
        className={styles.wishTextarea}
        placeholder="Write your wish for the couple…"
        required
        rows={expanded ? 3 : 1}
        value={form.message}
        onFocus={() => setExpanded(true)}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
      />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}
          >
            {sent && <p className={styles.sectionLead}>Thank you — your wish was sent.</p>}
            <input
              className={styles.field}
              placeholder="Your name *"
              required
              value={form.guestName}
              onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
            />
            {/* The engraved submit-btn art is this button's background, rather than its own
                layer — a separate layer would have to be kept in sync with the button's
                position forever. */}
            <button type="submit" className={styles.wishSubmit} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Wish'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

/** Paginates 10-at-a-time (Template5.tsx's own convention) rather than dumping every wish onto
 *  the page at once — a "Load more" button reveals the next batch. */
export function WishListSlot({ wishes }: SlotProps) {
  const [shown, setShown] = useState(10);
  return (
    <div className={styles.wishList}>
      {wishes.length === 0 ? (
        <p className={styles.empty}>No wishes yet — be the first to write one.</p>
      ) : (
        <>
          {wishes.slice(0, shown).map((w) => (
            <blockquote key={w.wishId} className={styles.wishItem}>
              <div className={styles.wishFrom}>{w.guestName}</div>
              <p className={styles.wishMsg}>“{w.message}”</p>
            </blockquote>
          ))}
          {wishes.length > shown && (
            <button type="button" className={styles.linkBtn} onClick={() => setShown((n) => n + 10)}>
              Load more ({wishes.length - shown} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
