'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useSheets } from '../slots/sheets';
import { interactionAvailable, type CinematicInteraction } from './direction';
import { resolveCinematicTrackClip, type CinematicSequenceTrack, type CinematicSequenceBeat } from './sequence';
import type { CinematicWorldLayer } from './world';

type Phase = 'ready' | 'open' | 'closing' | 'dismissed';
interface State { phases: Record<string, Phase>; infoId?: string; focusId?: string; activeId?: string }
type Action = { type: 'phase'; id: string; phase: Phase } | { type: 'info' | 'focus'; id?: string };
function reducer(state: State, action: Action): State {
  if (action.type === 'phase') return state.phases[action.id] === action.phase ? state
    : { ...state, ...(action.phase === 'open' ? { activeId: action.id } : {}), phases: { ...state.phases, [action.id]: action.phase } };
  return { ...state, [action.type === 'info' ? 'infoId' : 'focusId']: action.id };
}

export function useDirectedInteractions({ definitions, tracks, beats, progress, seek, editing }: {
  definitions: CinematicInteraction[]; tracks: CinematicSequenceTrack[]; beats: CinematicSequenceBeat[];
  progress: number; seek: (progress: number) => void; editing: boolean;
}) {
  const { openId, open, close } = useSheets();
  const [state, dispatch] = useReducer(reducer, { phases: {} });
  const active = useRef<string | undefined>(undefined);
  const previousSheet = useRef<string | null>(null);
  const returns = useRef(new Map<string, number>());
  const lastPosition = useRef(0);
  const closingTimers = useRef(new Map<string, number>());
  const seekRef = useRef(seek);
  useEffect(() => { seekRef.current = seek; }, [seek]);
  useEffect(() => () => { closingTimers.current.forEach(window.clearTimeout); closingTimers.current.clear(); }, []);
  const phase = (id: string): Phase => state.phases[id] ?? 'ready';
  const recordFor = (layer: CinematicWorldLayer) => definitions.find((record) => record.enabled && record.triggerLayerId === layer.id)
    ?? definitions.find((record) => record.triggerLayerId === layer.id)
    ?? definitions.find((record) => record.id === layer.interactionId && !record.triggerLayerId);
  const available = (record?: CinematicInteraction) => Boolean(record && interactionAvailable(record, tracks, progress));
  const trigger = (record: CinematicInteraction) => {
    if (editing || !available(record)) return;
    if (record.action === 'focus' || record.action === 'navigate') {
      const previous = returns.current.get(record.id);
      if (previous !== undefined && record.returnMode === 'previous') {
        returns.current.delete(record.id); dispatch({ type: 'focus' }); seek(previous); return;
      }
      const beat = beats.find((candidate) => candidate.id === record.targetBeatId);
      if (!beat) return;
      lastPosition.current = progress;
      if (record.returnMode === 'previous') returns.current.set(record.id, progress);
      dispatch({ type: 'focus', id: record.id }); seek(beat.at); return;
    }
    if (record.action === 'return') { seek(lastPosition.current); return; }
    active.current = record.id;
    lastPosition.current = progress;
    dispatch({ type: 'phase', id: record.id, phase: 'open' });
    if (record.action === 'info') dispatch({ type: 'info', id: record.id });
    else open(record.action);
  };
  const dismissInfo = useCallback(() => {
    if (state.infoId) dispatch({ type: 'phase', id: state.infoId, phase: 'closing' });
    dispatch({ type: 'info' });
  }, [state.infoId]);

  useEffect(() => {
    if (previousSheet.current && previousSheet.current !== openId && active.current) {
      dispatch({ type: 'phase', id: active.current, phase: 'closing' });
    }
    previousSheet.current = openId;
  }, [openId]);
  useEffect(() => {
    const timers = closingTimers.current;
    for (const [id, timer] of timers) {
      if (state.phases[id] !== 'closing' || !definitions.some((record) => record.id === id)) {
        window.clearTimeout(timer); timers.delete(id);
      }
    }
    for (const record of definitions) {
      if (state.phases[record.id] === 'closing' && !timers.has(record.id)) timers.set(record.id, window.setTimeout(() =>
        { dispatch({ type: 'phase', id: record.id, phase: 'dismissed' });
          if (record.returnMode === 'previous') seekRef.current(lastPosition.current);
        }, record.closeMs));
    }
  }, [definitions, state.phases]);
  useEffect(() => {
    const timers: number[] = [];
    for (const record of definitions) {
      const reset = tracks.find((track) => track.id === record.resetTrackId);
      if (reset && progress < resolveCinematicTrackClip(reset, tracks).end &&
        state.phases[record.id] === 'dismissed' && !openId && state.infoId !== record.id) {
        timers.push(window.setTimeout(() => dispatch({ type: 'phase', id: record.id, phase: 'ready' }), 0));
      }
    }
    return () => timers.forEach(window.clearTimeout);
  }, [definitions, tracks, progress, state.phases, state.infoId, openId]);
  useEffect(() => {
    if (!state.infoId) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[data-cinematic-info]');
    dialog?.querySelector<HTMLElement>('button')?.focus();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissInfo();
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keyDown);
    return () => { window.removeEventListener('keydown', keyDown); previous?.focus(); };
  }, [state.infoId, dismissInfo]);
  const activeRecord = definitions.find((record) => record.id === (state.infoId ?? state.activeId));
  const isOpen = Boolean(openId || state.infoId);
  useEffect(() => {
    if (!isOpen || editing || activeRecord?.lockScroll === false) return;
    const body = document.body, scrollY = window.scrollY;
    const previous = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width };
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, left: '0', right: '0', width: '100%' });
    return () => { Object.assign(body.style, previous); window.scrollTo(0, scrollY); };
  }, [isOpen, editing, activeRecord?.lockScroll]);
  return { phase, recordFor, available, trigger, close, isOpen, focusId: state.focusId,
    info: definitions.find((record) => record.id === state.infoId), dismissInfo };
}
