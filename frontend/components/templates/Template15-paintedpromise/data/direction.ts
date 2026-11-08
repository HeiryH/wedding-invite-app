import { MOTION_DEFAULT, type CinematicDirection, type CinematicEffect, type CinematicInteraction, type CinematicMotion } from '../../_shared/cinematic/direction';

const effect = (id: string, label: string, targetId: string, from: Partial<CinematicMotion>, to: Partial<CinematicMotion>, extra: Partial<CinematicEffect> = {}): CinematicEffect => ({
  id, label, targetId, target: 'layer', trackId: id, kind: 'transform', enabled: true, easing: 'linear',
  from: { ...MOTION_DEFAULT, ...from }, to: { ...MOTION_DEFAULT, ...to }, amplitudeX: 0, amplitudeY: 0, frequency: 1, ...extra,
});
const interaction = (id: string, label: string, triggerLayerId: string, action: CinematicInteraction['action'], extra: Partial<CinematicInteraction>): CinematicInteraction => ({
  id, label, triggerLayerId, action, enabled: true, availabilityTrackId: '', resetTrackId: '', targetBeatId: '',
  returnMode: 'scene', returnSetIds: [], revealSetIds: [], lockScroll: true, openMs: 550, closeMs: 620, infoTitle: 'Information', infoBody: '', ...extra,
});

export const PAINTED_PROMISE_DIRECTION: CinematicDirection = {
  effects: [
    effect('cloud-drift', 'Cloud drift', 'clouds', { x: -3, y: -2, scale: 1.17 }, { x: 4, y: -2, scale: 1.17 }, { kind: 'drift', amplitudeY: 2.2 }),
    effect('groom-hand-motion', 'Groom hand entrance', 'welcome-groom-hand', { xVw: -48, yVh: 33, rotate: 5 }, {}),
    effect('bride-hand-motion', 'Bride hand entrance', 'welcome-bride-hand', { xVw: 44, yVh: -30, rotate: -5 }, {}),
    effect('ring-motion', 'Ring fitting', 'welcome-ring', { xVw: 8, yVh: 7, scale: .72 }, {}),
    effect('memory-background-blur', 'Memory background blur', '', {}, { blur: 8 }, { target: 'world', kind: 'blur' }),
    effect('memory-approach', 'Memory arch approach', 'memory-wall', { scale: 1.22 }, {}, { trackId: 'memory', easing: 'ease-out' }),
    effect('rsvp-paper', 'RSVP paper lift', 'rsvp-letter:content', { y: 28, scale: .78 }, { y: -50 }, {
      trackId: 'rsvp', easing: 'ease-out', desktop: { from: { ...MOTION_DEFAULT, y: 28, scale: .78 }, to: { ...MOTION_DEFAULT, y: -18 } },
    }),
  ],
  interactions: [
    interaction('programme-focus', 'Open programme', 'programme-board', 'programme', { returnMode: 'stay' }),
    interaction('rsvp', 'RSVP form', 'rsvp-letter', 'rsvp', { availabilityTrackId: 'rsvp-availability', resetTrackId: 'rsvp-reset-window', returnSetIds: ['table'], revealSetIds: ['table-wishes'] }),
    interaction('wish', 'Best Wishes form', 'wishes-book', 'wish', { availabilityTrackId: 'wishes-availability', resetTrackId: 'wishes-reset-window', returnSetIds: ['table'] }),
  ],
  pacing: { mobileVh: 1250, desktopVh: 1150, beats: {} },
  navigation: [
    { id: 'welcome', label: 'Welcome', target: 'track-start', targetId: 'welcome' },
    { id: 'walimah', label: 'Walimah', target: 'beat', targetId: 'walimah' },
    { id: 'itinerary', label: 'Programme', target: 'track-enter', targetId: 'programme' },
    { id: 'rsvp', label: 'RSVP', target: 'track-enter', targetId: 'table' },
    { id: 'wishes', label: 'Wishes', target: 'track-start', targetId: 'table-wishes' },
    { id: 'photobooth', label: 'Memories', target: 'track-start', targetId: 'memory-background-blur' },
  ],
  theme: {
    ink: '#4a3a32', secondaryInk: '#9d6c52', accent: '#b77b65', panel: '#fffcf4', border: '#b2855a', page: '#8bcafb',
    shadow: .22, radius: 22, displayFont: '', bodyFont: '', titleSize: 9, bodySize: 2,
    memory: { frames: 6, maxPhotos: 6, columns: 3, gap: 4, tilt: 1.5, frameColor: '#d4a65f', borderWidth: 5, placeholder: '♡', captionX: 50, captionY: 5, captionWidth: 70 },
  },
};
