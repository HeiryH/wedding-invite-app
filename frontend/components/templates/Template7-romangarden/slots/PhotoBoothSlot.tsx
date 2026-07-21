'use client';

import { useRef } from 'react';
import type { SlotProps } from '../types';
import { T7_ASSETS } from '../data/stages';
import styles from '../Template7.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

const STEPS = [
  { title: 'Snap a Photo', desc: 'Take as many photos as you like.' },
  { title: 'Leave a Memory', desc: 'Stick it in our guestbook with a sweet note.' },
  { title: 'Cherish Forever', desc: 'Your memory, our keepsake.' },
];

export default function PhotoBoothSlot({ photos, onUploadPhoto, t, editing }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPhoto || editing) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('guestName', 'Guest');
    await onUploadPhoto(fd);
    e.target.value = '';
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{t('photobooth.title', 'Photo Booth')}</h3>

      <div className={styles.steps}>
        {STEPS.map((s) => (
          <div key={s.title} className={styles.step}>
            <div className={styles.stepTitle}>{s.title}</div>
            <p className={styles.stepDesc}>{s.desc}</p>
          </div>
        ))}
      </div>

      {onUploadPhoto && (
        <div className={styles.uploadRow}>
          <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
          <button
            type="button"
            className={`${styles.plaque} ${styles.plaqueBtn}`}
            onClick={() => inputRef.current?.click()}
          >
            Upload a Photo
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div className={styles.gallery}>
          {photos.map((p, i) => (
            <figure key={p.photoId} className={styles.photoFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_BASE}${p.photoUrl}`}
                alt={p.caption || 'Guest photo'}
                className={styles.photo}
                loading="lazy"
                decoding="async"
              />
              {/* Alternate the two engraved frames so the grid doesn't read as a repeat */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${T7_ASSETS}/photobooth/${i % 2 === 0 ? 'square-frame' : 'oval-frame'}.webp`}
                alt=""
                className={styles.photoFrameArt}
                loading="lazy"
                decoding="async"
              />
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
