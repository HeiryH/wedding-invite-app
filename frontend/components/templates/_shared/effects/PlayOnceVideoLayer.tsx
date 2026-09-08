'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { Layer } from '../types';
import { drawKeyedFrame, hasDecodedFrame } from './chromaKey';

/**
 * A play-once chromakey video — `kind: 'video'`. Sits on the page as a still image until the
 * scene has settled, then plays its animation through exactly once and **holds the last frame**.
 *
 * Deliberately NOT scroll-scrubbed (that's `ScrollVideoLayer`, `kind: 'scrollVideo'`): there is no
 * reverse, no rewind, and no coupling to scroll position at all. The sequence is load → wait →
 * play → hold. Template 7's welcome arch (vines growing up the columns) is the first consumer.
 *
 * The wait exists so the animation doesn't compete with the page arriving. Playback starts only
 * once all three are true:
 *   1. the layer has been on screen at least once (IntersectionObserver — an arch below the fold
 *      shouldn't burn its one and only playthrough before anyone sees it),
 *   2. the document has finished loading (`window.load`), so decoding doesn't fight image fetches,
 *   3. this layer's own entrance animation has finished — mirrors Layer.tsx's `--sl-delay`
 *      (`0.35 + order * 0.22`) plus its duration, so the piece has landed before it comes alive.
 */
export interface PlayOnceVideoLayerProps {
  /** Resolved video URL (asset-root resolution is the caller's job — mirrors Layer.tsx's `img`). */
  src: string;
  /** The layer's own positioned box; used as the IntersectionObserver target. */
  boxRef: RefObject<HTMLElement | null>;
  /** Fully-resolved layer (shipped defaults already merged with any saved override). */
  layer: Layer;
  /** Intrinsic [w, h] from the template's asset manifest, when known. Sets the canvas's own
   *  width/height attributes up front so a `chain: true` (height:auto) box reserves the right
   *  space immediately — without it the canvas reports its default 300x150 until the first frame
   *  decodes, and the layer visibly jumps. Same job `assetSizes` does for `img` layers. */
  size?: [number, number];
  className?: string;
}

export default function PlayOnceVideoLayer({ src, boxRef, layer, size, className }: PlayOnceVideoLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const playedRef = useRef(false);

  const {
    chromaThreshold = 18, chromaFade = 10, order = 0, animDur = 1, playDelaySec,
  } = layer;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!video || !canvas || !box) return;

    let cancelled = false;

    const paint = () => {
      if (cancelled) return;
      if (!hasDecodedFrame(video)) {
        rafRef.current = requestAnimationFrame(paint);
        return;
      }
      if (!ctxRef.current) ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
      const ctx = ctxRef.current;
      if (!ctx) return;
      drawKeyedFrame(video, canvas, ctx, chromaThreshold, chromaFade);
      // Keep painting only while the animation is actually running; once it ends we hold the
      // final frame, so there is nothing left to repaint (an idle rAF loop keying 1.5M pixels a
      // frame would be a real battery cost on a page that's otherwise static).
      if (!video.paused && !video.ended) rafRef.current = requestAnimationFrame(paint);
    };

    // Show the first frame while waiting. `preload="auto"` + an explicit seek gets a decoded frame
    // on screen without playing; without this the layer would be an empty hole until playback.
    const showFirstFrame = () => {
      if (video.readyState >= 1) video.currentTime = 0;
      paint();
    };
    if (video.readyState >= 1) showFirstFrame();
    else video.addEventListener('loadedmetadata', showFirstFrame, { once: true });

    const onSeeked = () => paint();
    video.addEventListener('seeked', onSeeked);

    const play = () => {
      if (cancelled || playedRef.current) return;
      playedRef.current = true;
      // Muted + playsInline is autoplay-eligible on iOS/Android; if a policy still blocks it we
      // keep the first frame on screen rather than throwing, which degrades to today's static art.
      video.play().then(paint).catch(() => {});
    };

    // (3) entrance-animation delay — mirrors Layer.tsx's `--sl-delay` + the reveal duration.
    const waitMs = (playDelaySec ?? 0.35 + order * 0.22 + animDur) * 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // (2) document fully loaded.
    const afterLoad = (run: () => void) => {
      if (document.readyState === 'complete') run();
      else window.addEventListener('load', run, { once: true });
      return () => window.removeEventListener('load', run);
    };

    // (1) seen at least once.
    let removeLoad: (() => void) | undefined;
    const armPlayback = () => {
      removeLoad = afterLoad(() => { timer = setTimeout(play, waitMs); });
    };

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'undefined') {
      armPlayback();
    } else {
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { io?.disconnect(); armPlayback(); break; }
        }
      }, { threshold: 0.15 });
      io.observe(box);
    }

    return () => {
      cancelled = true;
      io?.disconnect();
      removeLoad?.();
      if (timer) clearTimeout(timer);
      video.removeEventListener('loadedmetadata', showFirstFrame);
      video.removeEventListener('seeked', onSeeked);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [src, boxRef, chromaThreshold, chromaFade, order, animDur, playDelaySec]);

  return (
    <>
      <video
        ref={videoRef}
        // Off-screen rather than display:none — many browsers stop decoding frames for a
        // display:none element, which would starve the canvas (same reasoning as ScrollVideoLayer).
        style={{ position: 'fixed', top: -9999, left: -9999, width: 128, height: 128, opacity: 0, pointerEvents: 'none' }}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} width={size?.[0]} height={size?.[1]} className={className} aria-hidden />
    </>
  );
}
