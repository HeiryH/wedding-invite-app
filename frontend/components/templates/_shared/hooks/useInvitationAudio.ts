'use client';
import { useContext, useEffect, useRef, useState } from 'react';
import { GuestExecutionContext, GuestFeedbackContext } from '../guest/useGuestSubmission';

/** Audio resource lifetime and truthful playback state, independent of a template's controls. */
export function useInvitationAudio(url: string, loop: boolean, { autoPlay = false, disabled = false, unlockOnScroll = false } = {}) {
  const mode = useContext(GuestExecutionContext), report = useContext(GuestFeedbackContext);
  const enabled = !disabled && mode === 'live';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState({ playing: false, needsGesture: false });
  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    const audio = new Audio(url); audio.preload = 'none'; audio.loop = loop; audioRef.current = audio;
    // A new external media resource starts paused, even when the previous source was playing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ playing: false, needsGesture: false });
    const playing = () => { if (!cancelled) setState({ playing: true, needsGesture: audio.muted }); };
    const paused = () => { if (!cancelled) setState({ playing: false, needsGesture: false }); };
    const unlock = () => { audio.muted = false; if (!cancelled) setState((current) => ({ ...current, needsGesture: false })); };
    const events = unlockOnScroll ? ['click', 'touchstart', 'scroll'] : ['click', 'touchstart'];
    audio.addEventListener('play', playing); audio.addEventListener('pause', paused); audio.addEventListener('ended', paused);
    if (autoPlay) void audio.play().catch(async () => {
      if (cancelled) return;
      audio.muted = true;
      try {
        await audio.play(); if (cancelled) return;
        playing(); events.forEach((event) => document.addEventListener(event, unlock, { once: true, passive: true }));
      } catch { paused(); }
    });
    return () => {
      cancelled = true; events.forEach((event) => document.removeEventListener(event, unlock));
      audio.removeEventListener('play', playing); audio.removeEventListener('pause', paused); audio.removeEventListener('ended', paused);
      audio.pause(); audio.src = ''; if (audioRef.current === audio) audioRef.current = null;
    };
  }, [url, loop, autoPlay, enabled, unlockOnScroll]);
  const toggle = async () => {
    const audio = audioRef.current; if (!audio || !enabled) return;
    if (!audio.paused && !audio.muted) audio.pause();
    else {
      audio.muted = false;
      try { await audio.play(); }
      catch { if (audioRef.current !== audio) return; setState({ playing: false, needsGesture: false }); report('Music could not play. Please try again.'); }
    }
  };
  return { isPlaying: enabled && Boolean(url) && state.playing, needsGesture: state.needsGesture, toggle, enabled };
}
