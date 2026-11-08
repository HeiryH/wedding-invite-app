import type { Layer, StageDef } from '../_shared/types';

const anchor = (id: string, label: string, styleable = false, parent?: string): Layer => ({
  id, label, kind: 'anchor', parent, styleable,
  x: 50, y: 50, w: 100, h: 20, s: 1, z: 1, order: 0,
  chain: true, hidden: false, opacity: 1,
});

const stage = (id: string, label: string, layers: Layer[]): StageDef => ({
  id, label, bg: '', bgFit: 'cover', layers,
});

export const T16_STAGES: Record<string, StageDef> = {
  welcome: stage('welcome', 'Cover', [
    anchor('ribbon', 'Ribbon artwork'),
    anchor('heading', 'Invitation heading', true),
    anchor('eventTitle', 'Event title', true),
    anchor('names', 'Couple names'),
    anchor('firstName', 'First name', true, 'names'),
    anchor('connector', 'Ampersand', true, 'names'),
    anchor('secondName', 'Second name', true, 'names'),
    anchor('date', 'Date', true),
    anchor('venue', 'Venue', true),
    anchor('islamicDate', 'Islamic date', true),
    anchor('countdown', 'Countdown'),
  ]),
  walimah: stage('walimah', 'Ceremony', [
    anchor('medallion', 'Medallion artwork'),
    anchor('content', 'Ceremony content'),
    anchor('title', 'Title', true, 'content'),
    anchor('body', 'Invitation message', false, 'content'),
    anchor('date', 'Date and time', true, 'content'),
    anchor('venue', 'Venue', true, 'content'),
    anchor('actions', 'Map and calendar', false, 'content'),
  ]),
  rsvp: stage('rsvp', 'RSVP', [
    anchor('trail', 'Envelope artwork'),
    anchor('content', 'RSVP content'),
    anchor('title', 'Title', true, 'content'),
    anchor('flourish', 'Heart flourish', false, 'content'),
    anchor('prompt', 'Prompt', true, 'content'),
    anchor('form', 'RSVP form', false, 'content'),
  ]),
  itinerary: stage('itinerary', 'Itinerary', [
    anchor('trail', 'Heart trail artwork'),
    anchor('content', 'Programme content'),
    anchor('title', 'Title', true, 'content'),
    anchor('programme', 'Programme entries', false, 'content'),
  ]),
  wishes: stage('wishes', 'Wishes', [
    anchor('title', 'Title', true),
    anchor('flourish', 'Heart flourish'),
    anchor('prompt', 'Prompt', true),
    anchor('guestbook', 'Guestbook form and messages'),
    anchor('note', 'Envelope artwork'),
  ]),
  photobooth: stage('photobooth', 'Photo Booth', [
    anchor('flash', 'Flash artwork'),
    anchor('content', 'Photo booth content'),
    anchor('title', 'Title', true, 'content'),
    anchor('flourish', 'Heart flourish', false, 'content'),
    anchor('prompt', 'Prompt', true, 'content'),
    anchor('album', 'Gallery and upload', false, 'content'),
  ]),
};
