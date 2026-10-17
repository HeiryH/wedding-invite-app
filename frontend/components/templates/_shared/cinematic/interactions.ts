import {
  cinematicTrackIsActive,
  resolveCinematicTrackClip,
  type CinematicSequenceTrack,
} from './sequence';

export type CinematicSheetId = 'rsvp' | 'wish';
export type CinematicInteractionPhase = 'ready' | 'open' | 'closing' | 'dismissed';

export interface CinematicInteractionState {
  rsvp: CinematicInteractionPhase;
  wish: CinematicInteractionPhase;
}

export type CinematicInteractionAction =
  | { type: 'open'; id: CinematicSheetId }
  | { type: 'close'; id: CinematicSheetId }
  | { type: 'finish-close'; id: CinematicSheetId }
  | { type: 'reset'; id?: CinematicSheetId };

export const INITIAL_CINEMATIC_INTERACTIONS: CinematicInteractionState = {
  rsvp: 'ready',
  wish: 'ready',
};

/**
 * Functional tracks use their interaction target when they have one. Older authored tracks used
 * a visual group target, so the track id remains the compatibility key (with wishes normalised to
 * the sheet id used by the runtime).
 */
export function cinematicInteractionTrackKey(track: CinematicSequenceTrack) {
  if (track.target.type === 'interaction') return track.target.id;
  return track.id === 'wishes' ? 'wish' : track.id;
}

export function findCinematicInteractionTrack(
  tracks: CinematicSequenceTrack[],
  id: string,
) {
  return tracks.find((track) => track.kind === 'interaction' &&
    track.target.type === 'interaction' && track.target.id === id)
    ?? tracks.find((track) =>
      track.kind === 'interaction' && cinematicInteractionTrackKey(track) === id);
}

/** The authored range only answers whether a guest may trigger the interaction at this moment. */
export function cinematicInteractionAvailable(
  tracks: CinematicSequenceTrack[],
  id: string,
  progress: number,
) {
  const track = findCinematicInteractionTrack(tracks, id);
  return Boolean(track && cinematicTrackIsActive(progress, track, tracks));
}

/** Keep the table visible after dismissing a sheet until its authored availability range ends. */
export function cinematicInteractionReturnsToScene(
  tracks: CinematicSequenceTrack[],
  id: CinematicSheetId,
  phase: CinematicInteractionPhase,
  progress: number,
) {
  if (phase !== 'closing' && phase !== 'dismissed') return false;
  const track = findCinematicInteractionTrack(tracks, id);
  if (!track) return false;
  return progress < resolveCinematicTrackClip(track, tracks).end;
}

/** Pure lifecycle for scroll props that temporarily hand control to a functional bottom sheet. */
export function cinematicInteractionReducer(
  state: CinematicInteractionState,
  action: CinematicInteractionAction,
): CinematicInteractionState {
  if (action.type === 'reset') {
    if (!action.id) return { ...INITIAL_CINEMATIC_INTERACTIONS };
    return state[action.id] === 'ready' ? state : { ...state, [action.id]: 'ready' };
  }
  if (action.type === 'open') {
    return state[action.id] === 'open' ? state : { ...state, [action.id]: 'open' };
  }
  if (action.type === 'close') {
    if (state[action.id] === 'closing' || state[action.id] === 'dismissed') return state;
    return { ...state, [action.id]: 'closing' };
  }
  if (state[action.id] !== 'closing') return state;
  return { ...state, [action.id]: 'dismissed' };
}
