'use client';
import CoupleGallery, { orderedCoupleGallery } from '../CoupleGallery';
import type { SlotProps } from '../types';

/** Explicit authoring block; never injected into an existing composition. */
export default function CoupleGallerySlot({ coupleMedia, config, t, layer }: SlotProps) {
  return <CoupleGallery id={`couple-gallery-${layer?.id ?? 'slot'}`} photos={orderedCoupleGallery(coupleMedia, config?.['gallery.order'])}
    title={layer?.text || t('gallery.title', 'Our photos')} fit={t('gallery.fit', 'cover')} layout={t('gallery.layout', 'grid')} />;
}
