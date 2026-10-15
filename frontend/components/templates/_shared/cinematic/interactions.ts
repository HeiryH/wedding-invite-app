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
