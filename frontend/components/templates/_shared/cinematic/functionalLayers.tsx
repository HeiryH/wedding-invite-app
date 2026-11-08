import { getImageUrl } from '@/lib/utils';
import { formatEventDate, formatEventTime } from '@/lib/eventDateFormat';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { Fragment } from 'react';
import { resolveBindings } from '../bindings';
import type { SlotProps } from '../types';
import { fontVar } from '@/lib/fonts/registry';
import type { CinematicSceneEntry } from './scene';
import type { CinematicLayerDecoration } from './CinematicSceneLayers';
import type { CinematicInteraction, CinematicMotion, CinematicTheme } from './direction';

export const CINEMATIC_FUNCTIONS = [
  { id: 'artwork', label: 'Artwork', image: true },
  { id: 'background', label: 'Background', image: true },
  { id: 'programme-board', label: 'Programme board', image: true },
  { id: 'rsvp-envelope', label: 'RSVP envelope', image: true },
  { id: 'guest-book', label: 'Guest book', image: true },
  { id: 'memory-wall', label: 'Memory wall', image: true },
  { id: 'narrative', label: 'Narrative block', image: false },
  { id: 'scroll-cue', label: 'Scroll cue', image: false },
] as const;

export function cinematicRichHtml(value: string): string {
  const allowed = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote']);
  return value.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?([a-z][\w:-]*)\b[^>]*>/gi, (tag, name: string) =>
      allowed.has(name.toLowerCase()) ? `<${tag.startsWith('</') ? '/' : ''}${name.toLowerCase()}>` : '');
}

export interface CinematicFunctionContext {
  slotProps: SlotProps;
  theme: CinematicTheme;
  styles: Record<string, string>;
  editing: boolean;
  interaction?: CinematicInteraction;
  phase: string;
  available: boolean;
  focused: boolean;
  fire: () => void;
  contentMotion?: CinematicMotion;
  apiBase: string;
  renderPart?: (part: string, element: ReactElement) => ReactNode;
}
type Renderer = (entry: CinematicSceneEntry, context: CinematicFunctionContext) => CinematicLayerDecoration;
const plainPart = (_part: string, element: ReactElement): ReactNode => element;

const registry: Record<string, Renderer> = {
  artwork: () => ({}),
  background: (_, context) => ({ className: context.styles.clouds }),
  'programme-board': ({ layer }, { styles: s, slotProps: { wedding, t, itinerary = [] }, editing, available, fire, renderPart: part = plainPart }) => ({
    interactive: !editing && available,
    children: <div role={editing ? undefined : 'button'} tabIndex={!editing && available ? 0 : undefined} className={s.boardObject} onClick={() => !editing && available && fire()}
      onKeyDown={(event) => { if (!editing && available && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); fire(); } }}
      aria-label="View programme">
      {part('artwork', /* eslint-disable-next-line @next/next/no-img-element -- Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. */
                       <img src={layer.src} alt="" />)}
      {part('copy', <span className={s.boardCopy}>{part('title', <strong>{layer.title || t('itinerary.title', 'Programme')}</strong>)}
        {part('items', <span className={s.boardItems}>{itinerary.length
          ? itinerary.map((item, index) => <Fragment key={item.itineraryItemId}>{part(`row-${index}`, <span className={s.boardRow}>{part(`time-${index}`, <b>{item.detail}</b>)}{part(`label-${index}`, <i style={{ fontStyle: 'normal' }}>{item.label}</i>)}</span>)}</Fragment>)
          : <span>The programme will be shared here soon.</span>}</span>)}
        {(wedding.venue || wedding.venueAddress) && part('venue', <span className={s.boardVenue}>{wedding.venue || wedding.venueAddress}</span>)}
        {part('calendar', <span className={s.boardCalendar}>{t('ceremony.calendar_label', 'Save to calendar')}{(wedding.venue || wedding.venueAddress) ? ' · View venue' : ''}</span>)}
      </span>)}{part('action', <span className={s.boardAction} aria-hidden="true">View programme</span>)}
    </div>,
  }),
  'rsvp-envelope': ({ layer }, { styles: s, slotProps: { t }, editing, available, phase, fire, contentMotion: motion, renderPart: part = plainPart }) => ({
    interactive: !editing && available,
    className: phase === 'closing' ? s.interactionClosing : s.interactionObject,
    children: <div role={editing ? undefined : 'button'} tabIndex={!editing && available ? 0 : undefined} className={s.letterButton} onClick={() => !editing && available && fire()}
      onKeyDown={(event) => { if (!editing && available && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); fire(); } }}
      aria-label="Open RSVP form" data-interaction-phase={phase}>
      {part('artwork', /* eslint-disable-next-line @next/next/no-img-element -- Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. */
                       <img src={layer.src} alt="" className={s.envelope} />)}
      {part('paper', <span className={s.letter} style={{ transform: `translate(-50%, ${phase === 'closing' ? 28 : motion?.y ?? -50}%) scale(${phase === 'closing' ? .78 : motion?.scale ?? 1})` }}>
        {part('subtitle', <small>{t('rsvp.subtitle', 'Kindly respond')}</small>)}{part('title', <strong>{layer.title || t('rsvp.title', 'RSVP')}</strong>)}{part('action', <em>Open response form</em>)}
      </span>)}
    </div>,
  }),
  'guest-book': ({ layer }, { styles: s, slotProps: { t }, editing, available, phase, fire, renderPart: part = plainPart }) => ({
    interactive: !editing && available,
    className: phase === 'closing' ? s.interactionClosing : s.interactionObject,
    children: <div role={editing ? undefined : 'button'} tabIndex={!editing && available ? 0 : undefined} onClick={() => !editing && available && fire()} aria-label="Open best wishes form"
      onKeyDown={(event) => { if (!editing && available && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); fire(); } }}
      className={`${s.bookButton} ${phase === 'closing' ? s.bookClosing : ''}`} data-interaction-phase={phase}>
      {part('artwork', /* eslint-disable-next-line @next/next/no-img-element -- Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. */
                       <img src={layer.src} alt="" />)}{part('copy', <span>{part('subtitle', <small>{t('wish.prompt', 'Write a blessing for the couple')}</small>)}
        {part('title', <strong>{layer.title || t('wish.title', 'Best Wishes')}</strong>)}{part('action', <em>Open guest book</em>)}</span>)}
    </div>,
  }),
  'memory-wall': ({ layer }, { styles: s, slotProps: { t, photos, photoBoothEnabled }, theme, apiBase, renderPart: part = plainPart }) => {
    const layout = theme.memory;
    const approved = photos.filter((photo) => photo.isApproved && photo.isVisible !== false).slice(0, layout.maxPhotos);
    return { visible: photoBoothEnabled, children: <section className={s.photoFinale}>
      {part('artwork', /* eslint-disable-next-line @next/next/no-img-element -- Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. */
                       <img src={layer.src} alt="" className={s.photoArch} />)}
      {part('frames', <div className={s.memoryFrames} style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)`, gap: `${layout.gap}%` }}>
        {Array.from({ length: layout.frames }, (_, index) => {
          const photo = approved[index];
          return <Fragment key={`frame-${index}`}>{part(`frame-${index}`, <figure className={s.memoryFrame} style={{
            borderColor: `var(--frame-border-color, ${layout.frameColor})`, borderWidth: `var(--frame-border-width, ${layout.borderWidth}px)`,
            transform: `rotate(${index % 3 === 2 ? -layout.tilt * .8 : index % 2 ? layout.tilt : 0}deg)`,
          }}>{photo ? /* eslint-disable-next-line @next/next/no-img-element -- Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. */
                      <img src={getImageUrl(photo.photoUrl, apiBase)} alt={photo.caption || 'Approved guest memory'} />
            : <span>{index === 0 ? t('photobooth.title', 'Our Memories') : layout.placeholder}</span>}</figure>)}</Fragment>;
        })}
      </div>)}
      {part('caption', <div className={s.photoCaption} style={{ left: `${layout.captionX}%`, bottom: `${layout.captionY}%`, width: `${layout.captionWidth}%` }}>
        {part('title', <h2>{layer.title || t('photobooth.title', 'Our Memories')}</h2>)}{part('subtitle', <p>{t('photobooth.prompt', 'Approved moments shared by the people who made this day ours.')}</p>)}
      </div>)}
    </section> };
  },
  narrative: ({ layer }, { slotProps, theme, styles: s, renderPart: part = plainPart }) => {
    const { wedding, t } = slotProps;
    const single = (wedding.eventType ?? 'WEDDING') !== 'WEDDING';
    const key = layer.contentKey ?? 'custom';
    if (key === 'primary' && single) return { visible: false };
    const isWalimah = key === 'walimah';
    const person = key === 'primary' ? 'primary' : key === 'honoree' || single ? 'honoree' : 'secondary';
    const name = person === 'primary' ? wedding.groomName || wedding.name2 : person === 'honoree'
      ? wedding.name1 || wedding.brideName : wedding.brideName || wedding.name1;
    const title = resolveBindings(layer.title, slotProps) || (isWalimah ? t('walimah.title', 'Walimatul Urus') : name || 'Our celebration');
    const body = layer.text ? resolveBindings(layer.text, slotProps) : isWalimah ? t('walimah.body', '') : key === 'custom' ? '' : t(`people.${person}.details`, 'Together with our families, we welcome you to share this special day.');
    const style: CSSProperties = {
      color: layer.color || theme.ink, fontFamily: fontVar(layer.fontFamily) || fontVar(theme.bodyFont) || 'var(--cinematic-body-font)',
      fontSize: layer.fontSize ? `${layer.fontSize}cqi` : `clamp(.9rem, ${theme.bodySize}cqi, ${theme.bodySize * .65}rem)`, fontWeight: layer.fontWeight ?? 400,
      textAlign: layer.textAlign ?? 'center', lineHeight: layer.lineHeight ?? 1.45, letterSpacing: `${layer.letterSpacing ?? 0}em`,
      background: layer.fill || undefined, borderRadius: layer.radius ?? theme.radius,
      border: layer.borderWidth ? `${layer.borderWidth}px solid ${layer.borderColor || theme.border}` : undefined,
    };
    return { children: <section className={s.narrative} style={style}>
      {key !== 'custom' && part('subtitle', <p>{isWalimah ? t('invite.heading', 'With the blessings of our families') : t(`people.${person}.title`, person === 'primary' ? 'The Groom' : person === 'honoree' ? 'Guest of Honour' : 'The Bride')}</p>)}
      {part('title', <h2 style={{ color: theme.secondaryInk, fontFamily: fontVar(layer.fontFamily) || fontVar(theme.displayFont) || 'var(--cinematic-display-font)', fontSize: layer.titleSize ? `${layer.titleSize}cqi` : `clamp(${isWalimah ? 3.2 : 2}rem, ${theme.titleSize * (isWalimah ? 1 : .66)}cqi, ${isWalimah ? 7 : 5}rem)` }}>{title}</h2>)}
      {part('body', <div dangerouslySetInnerHTML={{ __html: cinematicRichHtml(body) }} />)}
      {isWalimah && <>{part('date', <time>{formatEventDate(new Date(wedding.weddingDate), 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {formatEventTime(new Date(wedding.weddingDate), 'en-GB', { hour: 'numeric', minute: '2-digit' })}</time>)}
        {part('venue', <address>{wedding.venue}<br />{wedding.venueAddress}</address>)}</>}
    </section> };
  },
  'scroll-cue': ({ layer }, { slotProps, theme }) => ({ children: <p style={{ margin: 0, color: layer.color || theme.ink,
    textAlign: layer.textAlign ?? 'center', fontSize: `${layer.fontSize ?? .8}rem` }}>{resolveBindings(layer.text, slotProps)}</p> }),
};

export function renderCinematicFunction(entry: CinematicSceneEntry, context: CinematicFunctionContext): CinematicLayerDecoration {
  const decoration = registry[entry.layer.behavior ?? 'artwork']?.(entry, context) ?? {};
  const action = context.interaction;
  // Any image or text can become an interaction trigger; visual behaviour and action are separate.
  if (action && !['programme-board', 'rsvp-envelope', 'guest-book'].includes(entry.layer.behavior ?? '')) {
    return { ...decoration, interactive: !context.editing && context.available,
      className: context.phase === 'closing' ? context.styles.interactionClosing : decoration.className,
      children: <button type="button" aria-label={action.label} disabled={context.editing || !context.available} onClick={context.fire}
        style={{ border: 0, background: 'none', padding: 0, width: '100%', height: '100%', cursor: 'pointer', color: entry.layer.color || context.theme.ink,
          fontSize: entry.layer.kind === 'text' ? `${entry.layer.fontSize ?? 4}cqi` : undefined,
          fontFamily: fontVar(entry.layer.fontFamily), fontWeight: entry.layer.fontWeight,
          lineHeight: entry.layer.lineHeight, letterSpacing: `${entry.layer.letterSpacing ?? 0}em`, textAlign: entry.layer.textAlign, whiteSpace: 'pre-wrap' }}>
        {decoration.children ?? (entry.layer.kind === 'shape' ? <span style={{ display: 'block', width: '100%', height: '100%', background: entry.layer.fill, borderRadius: entry.layer.shape === 'ellipse' ? '50%' : entry.layer.radius }} /> : entry.layer.src ? /* eslint-disable-next-line @next/next/no-img-element -- Scene artwork and guest memories retain native intrinsic geometry within animated layer parts. */
                                                                                                                                                                                                                                                                   <img src={entry.layer.src} alt="" style={{ width: '100%', height: '100%', objectFit: entry.layer.fit ?? 'contain' }} /> : resolveBindings(entry.layer.text, context.slotProps))}
      </button> };
  }
  return decoration;
}
