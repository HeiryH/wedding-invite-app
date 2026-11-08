'use client';
import { getImageUrl } from '@/lib/utils';

import { useRef, useState } from 'react';
import type { Photo } from '@/lib/api';
import { TemplateSlots } from '@/lib/api/types';
import styles from './CoupleGallery.module.css';

export function orderedCoupleGallery(media: Photo[] = [], order?: string) {
  const gallery = media.filter((photo) => photo.templateSlot === TemplateSlots.COUPLE_GALLERY);
  const ranks = new Map(order?.split(',').map((id, index) => [id, index]));
  return gallery.sort((left, right) =>
    (ranks.get(String(left.photoId)) ?? Number.MAX_SAFE_INTEGER) - (ranks.get(String(right.photoId)) ?? Number.MAX_SAFE_INTEGER) ||
    left.photoId - right.photoId);
}

export const couplePhotoUrl = getImageUrl;

export function CouplePhoto({ photo, fit, alt, className }: {
  photo: Photo;
  fit?: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={couplePhotoUrl(photo.photoUrl)} alt={photo.caption || alt} className={className}
      loading="lazy" decoding="async" style={{ objectFit: fit === 'contain' ? 'contain' : 'cover' }} />
  );
}

export default function CoupleGallery({ photos, title, fit, layout, id = 'couple-gallery' }: {
  id?: string;
  photos: Photo[];
  title: string;
  fit?: string;
  layout?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  if (!photos.length) return null;
  const carousel = layout === 'carousel';
  const index = Math.min(active, photos.length - 1);

  return (
    <section id={id} data-stage={id} className={styles.gallery} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <div ref={rail} className={carousel ? styles.carousel : styles.grid}
        onScroll={carousel ? (event) => {
          const element = event.currentTarget;
          if (element.clientWidth) setActive(Math.round(element.scrollLeft / element.clientWidth));
        } : undefined}>
        {photos.map((photo, position) =>
          <CouplePhoto key={photo.photoId} photo={photo} fit={fit} alt={`Gallery photo ${position + 1}`} />
        )}
      </div>
      {carousel && photos.length > 1 && <div className={styles.controls}>
        <button type="button" aria-label="Previous photo" disabled={index === 0}
          onClick={() => rail.current?.scrollTo({ left: (index - 1) * rail.current.clientWidth })}>←</button>
        <span aria-live="polite">{index + 1} / {photos.length}</span>
        <button type="button" aria-label="Next photo" disabled={index === photos.length - 1}
          onClick={() => rail.current?.scrollTo({ left: (index + 1) * rail.current.clientWidth })}>→</button>
      </div>}
    </section>
  );
}
