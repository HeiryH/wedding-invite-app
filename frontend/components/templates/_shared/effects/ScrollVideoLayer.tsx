'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Layer } from '../types';

gsap.registerPlugin(ScrollTrigger);

/**
 * A scroll-scrubbed chromakey video effect — `kind: 'scrollVideo'` (Template 5's envelope is the
 * first and, so far, only consumer). Self-contained: owns its own `<video>`/`<canvas>` pair, the
 * rAF chromakey draw loop, and the GSAP `ScrollTrigger`. Renders no wrapper of its own — the
 * caller supplies `triggerRef` (the element ScrollTrigger measures) and positions/styles the
 * `<canvas>` via `className`, exactly as Template5.tsx already did before this was extracted.
 *
 * All the tunable numbers below were, until this component existed, hardcoded constants inside
 * Template5.tsx's own effect (see git history) — they're plain `Layer` fields now (types.ts),
 * resolved through the same `resolveStage`/`serializeStage` delta mechanism as every other layer,
 * so a PRO couple can tune them from the Adjust panel instead of them being fixed in code.
 */
export interface ScrollVideoLayerProps {
  /** Resolved video URL (asset-root resolution, if any, is the caller's job — see Layer.tsx's
   *  `img` case for the convention this mirrors). */
  src: string;
  /** The element GSAP's ScrollTrigger measures scroll progress against. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Fully-resolved layer (shipped defaults already merged with any saved override) — every
   *  effect field is expected to be a real number by the time this renders. */
  layer: Layer;
  /** Fires whenever the "fully open" plateau is entered/left (`tri` crosses `openThreshold`). */
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export default function ScrollVideoLayer({ src, triggerRef, layer, onOpenChange, className }: ScrollVideoLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => { onOpenChangeRef.current = onOpenChange; });

  const {
    triggerStart = 85, triggerEnd = 15, scrub = 0.5, pivot = 0.5, holdWidth = 0.04,
    videoStartSec = 0.5, openThreshold = 0.85, resetSec = 0.2,
    chromaThreshold = 30, chromaFade = 20,
  } = layer;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const trigger = triggerRef.current;
    if (!video || !canvas || !trigger) return;

    // iOS Safari blocks video decode until a user gesture — unlock on first touch/scroll.
    // `{once:true}` only deregisters a listener from its own event type, so touchstart and
    // scroll can otherwise both fire — the `unlocked` guard plus explicit removal of both
    // listeners on first fire is what actually prevents a double-unlock. No `video.load()`
    // here: it resets readyState and re-fires `loadedmetadata`, which is a destructive
    // side effect play()+pause() doesn't need to unlock decode.
    let unlocked = false;
    const unlockiOS = () => {
      if (unlocked) return;
      unlocked = true;
      document.removeEventListener('touchstart', unlockiOS);
      document.removeEventListener('scroll', unlockiOS);
      video.play().then(() => {
        video.pause();
        video.currentTime = videoStartSec;
      }).catch(() => {});
    };
    document.addEventListener('touchstart', unlockiOS, { once: true });
    document.addEventListener('scroll', unlockiOS, { once: true, passive: true } as AddEventListenerOptions);

    const draw = () => {
      // readyState < 2 means no decoded frame yet — keep retrying until HAVE_CURRENT_DATA.
      if (!video.videoWidth || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      if (!ctxRef.current) {
        ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
      }
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          if (lum < chromaThreshold) {
            d[i + 3] = 0;
          } else if (lum < chromaThreshold + chromaFade) {
            d[i + 3] = Math.round(((lum - chromaThreshold) / chromaFade) * 255);
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } catch {
        // canvas tainted — video frame is still visible without chromakey
      }
    };

    const scheduleDraw = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    scheduleDraw();

    const onSeeked = () => scheduleDraw();
    video.addEventListener('seeked', onSeeked);

    const setupScrollTrigger = () => {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const lo = pivot - holdWidth;
      const hi = pivot + holdWidth;
      // Seek a hair short of the true end rather than to `video.duration` itself — seeking to
      // exactly the end can tip the element into its `ended` state on some browsers.
      const maxSeek = Math.max(videoStartSec, video.duration - 0.04);

      const st = ScrollTrigger.create({
        trigger,
        start: `center ${triggerStart}%`,
        end: `center ${triggerEnd}%`,
        scrub,
        onUpdate: (self) => {
          // `tri` ramps 0->1 over [0, lo], holds at 1 across the [lo, hi] plateau, then falls
          // 1->0 over [hi, 1]. That IS "opens on approach, stays open around the pivot, closes on
          // the way out", and because it's a pure function of scroll position it rewinds exactly
          // in reverse when you scroll back up — which is the desired behaviour. Deliberately no
          // hysteresis/latching here: a latch would pin the open state and refuse to rewind.
          const p = self.progress;
          const tri =
            p < lo ? p / lo :
              p < hi ? 1 :
                (1 - p) / (1 - hi);
          video.currentTime = Math.min(maxSeek, videoStartSec + tri * (video.duration - videoStartSec));
          onOpenChangeRef.current?.(tri > openThreshold);
          scheduleDraw();
        },
        onLeave: () => {
          video.currentTime = resetSec;
          onOpenChangeRef.current?.(false);
          scheduleDraw();
        },
        onLeaveBack: () => {
          video.currentTime = resetSec;
          onOpenChangeRef.current?.(false);
          scheduleDraw();
        },
      });
      return () => st.kill();
    };

    let cleanup: (() => void) | undefined;
    const onLoadedMetadata = () => { cleanup = setupScrollTrigger(); };
    if (video.readyState >= 1) {
      cleanup = setupScrollTrigger();
    } else {
      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    }

    return () => {
      document.removeEventListener('touchstart', unlockiOS);
      document.removeEventListener('scroll', unlockiOS);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      cleanup?.();
      video.removeEventListener('seeked', onSeeked);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Re-instantiate on any effect-parameter change (live editing in the Adjust panel) or trigger
    // element swap. `src` is separate so a video-replace upload also gets picked up.
  }, [
    src, triggerRef, triggerStart, triggerEnd, scrub, pivot, holdWidth,
    videoStartSec, openThreshold, resetSec, chromaThreshold, chromaFade,
  ]);

  return (
    <>
      <video
        ref={videoRef}
        // Off-screen, not display:none — many browsers pause/skip video frame decoding on a
        // display:none element, which would starve the canvas draw loop of fresh frames.
        style={{ position: 'fixed', top: -9999, left: -9999, width: 128, height: 128, opacity: 0, pointerEvents: 'none' }}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
      >
        <source src={src} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} className={className} />
    </>
  );
}
