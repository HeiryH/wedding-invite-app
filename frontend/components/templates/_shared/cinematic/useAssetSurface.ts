'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { assetPerspectiveTransform, flatSurface, type AssetPerspective } from './assetPerspective';

export interface AssetSurface {
  perspective?: AssetPerspective;
  contactShadow?: number;
  shadowSoftness?: number;
}

export function useAssetSurface<T extends HTMLElement>({ perspective, contactShadow, shadowSoftness }: AssetSurface = {}, surfaceKey?: boolean) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const warped = Boolean(perspective?.some((point, i) => point.x !== flatSurface[i].x || point.y !== flatSurface[i].y));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!warped || !element) return;
    const measure = () => {
      const { offsetWidth: width, offsetHeight: height } = element;
      setSize((previous) => previous?.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [warped, surfaceKey]);

  const transform = warped && perspective && size ? assetPerspectiveTransform(perspective, size.width, size.height) : undefined;
  return { ref, style: {
    transform, transformOrigin: transform ? '0 0' : undefined,
    filter: contactShadow ? `drop-shadow(0 2px ${shadowSoftness ?? 4}px rgb(46 28 19 / ${contactShadow}))` : undefined,
  } };
}
