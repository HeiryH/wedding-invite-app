import { PAINTED_PROMISE_CAMERA, PAINTED_PROMISE_SEQUENCE, PAINTED_PROMISE_WORLD } from '../../Template15-paintedpromise/data/cinematic';
import type { CameraKeyframe } from './useCinematicScroll';
import type { CinematicWorldLayer } from './world';
import type { CinematicSequence, CinematicResolvedBeat } from './sequence';

export type CinematicEditorMode = 'scene' | 'camera-compose' | 'camera-beat';

export type CinematicBeat = CinematicResolvedBeat;

export interface CinematicEngine {
  keyPrefix: string;
  sequence: CinematicSequence;
  world: CinematicWorldLayer[];
  camera: CameraKeyframe[];
}

/**
 * Cinematic is intentionally a separate registry from the Stage/layer engine. It shares the
 * Customize shell and preview channel, but its primary editing unit is a camera beat in one
 * continuous world rather than an isolated StageDef.
 */
export const CINEMATIC_ENGINES: Record<number, CinematicEngine> = {
  15: {
    keyPrefix: 't15', sequence: PAINTED_PROMISE_SEQUENCE,
    world: PAINTED_PROMISE_WORLD, camera: PAINTED_PROMISE_CAMERA,
  },
};
