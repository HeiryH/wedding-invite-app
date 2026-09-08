import { toHijriString } from '@/lib/templateUtils';
import type { SlotProps } from './types';

/**
 * A `kind: 'text'`/curved-text layer's `text` field is one literal string, shared by every
 * wedding assigned to that authored template (it lives in `Template.StagesJson`, not per-wedding
 * config) — fine for static chrome, but wrong for anything that must actually vary per couple
 * (a name, a date). `{{token}}` placeholders let an author write `Wedding of {{brideName}}` once
 * and have it resolve per-visitor. A layer with no `{{` in its text is untouched (the common case),
 * so this costs nothing for ordinary custom text.
 *
 * Unresolved/unknown tokens are left literally in place (not blanked) — visible during authoring
 * so a typo in a token name is obvious rather than silently vanishing.
 */
const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.:-]+)\s*\}\}/g;

function formatDate(date: Date, style?: string): string {
  switch (style) {
    case 'ordinal': {
      const d = date.getDate();
      const suffix = d % 100 >= 11 && d % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][d % 10] ?? 'th');
      return `${d}${suffix} ${date.toLocaleDateString('en-GB', { month: 'long' })} ${date.getFullYear()}`;
    }
    case 'weekday':
      return date.toLocaleDateString('en-GB', { weekday: 'long' });
    case 'hijri':
      return toHijriString(date);
    case 'short':
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    case 'long':
    default:
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

function resolveToken(token: string, slotProps: SlotProps): string | undefined {
  const { wedding, t } = slotProps;
  const [name, arg] = token.split(':');
  const brideFirst = t('general.brideFirst', 'true') !== 'false';
  const first = brideFirst ? wedding.brideName : wedding.groomName;
  const second = brideFirst ? wedding.groomName : wedding.brideName;

  switch (name) {
    case 'brideName': return wedding.brideName;
    case 'groomName': return wedding.groomName;
    case 'firstName': return first;
    case 'secondName': return second;
    // Static chrome, not wedding data — but still worth a token so an authored template's
    // connector can be overridden per-template without hand-editing every text layer.
    case 'connector': return t('general.connector', '&');
    case 'heading': return t('invite.heading', 'The Wedding of');
    case 'venue': return wedding.venue;
    case 'venueAddress': return wedding.venueAddress ?? '';
    case 'date': return formatDate(new Date(wedding.weddingDate), arg);
    // Native Event fields (see Wedding's own comment) — a PARTY has one honoree and no "sides",
    // a CEREMONY has no individual names at all. `honoree` mirrors Template8's proven fallback
    // chain so a text layer reading it behaves the same as that hand-coded template.
    case 'eventTitle': return wedding.eventTitle ?? '';
    case 'name1': return wedding.name1 ?? '';
    case 'name2': return wedding.name2 ?? '';
    case 'honoree': return wedding.name1 || wedding.brideName || '';
    default: return undefined;
  }
}

/** Available tokens, for the Adjust panel's text-input helper UI. */
export const BINDING_TOKENS = [
  { token: 'brideName', label: "Bride's name" },
  { token: 'groomName', label: "Groom's name" },
  { token: 'firstName', label: 'First name (position 1)' },
  { token: 'secondName', label: 'Second name (position 2)' },
  { token: 'connector', label: 'Connector (&/and)' },
  { token: 'heading', label: 'Heading label' },
  { token: 'venue', label: 'Venue' },
  { token: 'venueAddress', label: 'Venue address' },
  { token: 'date:long', label: 'Date — long (12 December 2026)' },
  { token: 'date:ordinal', label: 'Date — ordinal (12th December 2026)' },
  { token: 'date:weekday', label: 'Date — weekday (Saturday)' },
  { token: 'date:hijri', label: 'Date — Hijri' },
  { token: 'eventTitle', label: 'Event title (CEREMONY)' },
  { token: 'name1', label: 'Name 1' },
  { token: 'name2', label: 'Name 2' },
  { token: 'honoree', label: 'Honoree (PARTY, falls back to bride name)' },
] as const;

export function resolveBindings(text: string | undefined, slotProps?: SlotProps): string {
  if (!text || !text.includes('{{') || !slotProps) return text ?? '';
  return text.replace(TOKEN_RE, (match, rawToken) => resolveToken(rawToken, slotProps) ?? match);
}
