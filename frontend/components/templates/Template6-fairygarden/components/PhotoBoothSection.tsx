'use client';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Photo } from '@/lib/api';
import styles from '../Template6.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

interface Props {
  photos: Photo[];
  onUploadPhoto?: (data: any) => Promise<void>;
}

export default function PhotoBoothSection({ photos, onUploadPhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPhoto) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('guestName', 'Guest');
    await onUploadPhoto(fd);
    e.target.value = '';
  };

  return (
    <section id="photobooth" className={styles.sectionPhotobooth}>
      <motion.div
        className={styles.sectionInner}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8 }}
      >
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecor}>✦</span>
          Photo Garden
          <span className={styles.titleDecor}>✦</span>
        </h2>

        {onUploadPhoto && (
          <div className={styles.uploadArea}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            <motion.button
              className={styles.uploadBtn}
              onClick={() => inputRef.current?.click()}
              whileTap={{ scale: 0.97 }}
            >
              📷 Share a Photo
            </motion.button>
          </div>
        )}

        {photos.length > 0 && (
          <div className={styles.photoGrid}>
            {photos.map((p, i) => (
              <motion.div
                key={p.photoId}
                className={styles.photoCard}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
              >
                <img
                  src={`${API_BASE}${p.photoUrl}`}
                  alt={p.guestName ?? 'Guest photo'}
                  className={styles.photoImg}
                  loading="lazy"
                />
                {p.guestName && <span className={styles.photoCaption}>{p.guestName}</span>}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
