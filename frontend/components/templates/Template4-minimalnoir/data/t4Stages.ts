import type { Layer, StageDef } from '@/components/templates/_shared/types';

/**
 * Template 4 (Minimal Noir) is a DOM/flow template, not a full-screen stage compositor. It opts
 * into the shared layer engine as a **hybrid overlay** (same recipe as Template 5): each block
 * keeps its responsive DOM, and layers sit on top of / alongside it, positioned as a percentage of
 * that block's own box.
 *
 * Two kinds of layer live here:
 *  - **anchor** layers (shipped as defaults below) — no visual of their own; they represent an
 *    existing DOM element (the countdown block, the ceremony card, …) and nudge it via a transform
 *    (see `useAnchors`). Geometry defaults to identity (x/y 50 = no offset, s 1), so existing
 *    weddings are unchanged until a PRO couple moves one.
 *  - **decorative** layers (text/shape/uploaded img) — added by the couple in the Adjust dock.
 *
 * There's no background image (`bg: ''`). Two elements are intentionally excluded from anchoring:
 * the hero's "Scroll" hint button (a continuous `repeat: Infinity` bounce — never settles, so a
 * nudge would fight it every frame) and the photo booth's draggable card stack (drag-driven via
 * `useMotionValue`, not a one-shot mount transition).
 */

export const T4_ASSETS = '/templates/t4';

const anchor = (id: string, label: string, parent?: string): Layer => ({
  id, kind: 'anchor', label, parent,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const stage = (id: string, label: string, layers: Layer[] = []): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

export const T4_STAGES: Record<string, StageDef> = {
  hero: stage('hero', 'Hero', [
    anchor('heading', 'Invite Label'),
    anchor('names', 'Couple Names'),
    anchor('date', 'Date'),
  ]),
  't4-details': stage('t4-details', 'Details', [
    anchor('countdown', 'Countdown Timer'),
    anchor('daybox', 'Day / Month'),
    anchor('body', 'Invite Body'),
    anchor('ceremony', 'Ceremony Card'),
    anchor('reception', 'Reception Card'),
  ]),
  't4-schedule': stage('t4-schedule', 'Schedule', [
    anchor('schedule', 'Schedule List'),
    anchor('photo', 'Couple Photo'),
  ]),
  't4-rsvp': stage('t4-rsvp', 'RSVP', [
    anchor('heading', 'RSVP Heading'),
  ]),
  't4-wishes': stage('t4-wishes', 'Wishes', [
    anchor('heading', 'Wishes Heading'),
  ]),
  't4-photobooth': stage('t4-photobooth', 'Photo Booth', [
    anchor('heading', 'Photo Booth Heading'),
  ]),
};

/** Ordered stage ids for the Adjust dock; `t4-photobooth` only when the photo booth is on. */
export function t4StageIds(photoBoothEnabled: boolean): string[] {
  const ids = ['hero', 't4-details', 't4-schedule', 't4-rsvp', 't4-wishes'];
  if (photoBoothEnabled) ids.push('t4-photobooth');
  return ids;
}
