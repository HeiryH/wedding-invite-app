'use client';
import { useWishPagination } from '@/components/templates/_shared/WishBatch';
import { formatEventDate, formatEventTime } from '@/lib/eventDateFormat';
import { configValue } from '@/components/templates/configValue';
import { useGuestSubmission } from '@/components/templates/_shared/guest/useGuestSubmission';
import { guestLimit, normalizeRsvp, seatsAvailable, tableCanFit } from '@/components/templates/_shared/guest/rules';

import { useContext, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { SeatingPreviewContext } from '../_shared/slots/preview';
import type { TemplateRenderProps } from '../templateTypes';
import type { SlotProps } from '../_shared/types';
import { TimerSlot } from '../_shared/slots/HeroSlots';
import { WalimahBodySlot } from '../_shared/slots/CeremonySlots';
import { uploadPhotoFile } from '../_shared/slots/PhotoBoothSlot';
import { calendarLinks, toHijriString } from '@/lib/templateUtils';
import { Ribbon, Medallion, Trail, Flourish, Note, Flash } from './Ornaments';
import styles from './Template16.module.css';
import { useAnchorsFor } from '../_shared/hooks/useAnchors';
import { useBreakpoint } from '../_shared/hooks/useBreakpoint';
import { T16_STAGES } from './stages';
import SectionOverlay from './SectionOverlay';
import CoupleGallery, { orderedCoupleGallery } from '@/components/templates/_shared/CoupleGallery';
import SectionNavigation from '../_shared/nav/SectionNavigation';
import { MusicSlot } from '../_shared/slots/ChromeSlots';

type Copy = (key: string, fallback: string) => string;

export default function Template16(props: TemplateRenderProps) {
  const { wedding, coupleMedia, customConfig = {}, itinerary = [], photoBoothEnabled, seatingEnabled = false, tables = [], editor } = props;
  const t: Copy = (key, fallback) => configValue(customConfig, key, fallback, 'preserve');
  const breakpoint = useBreakpoint(editor?.breakpoint);
  const { a, sx } = useAnchorsFor(T16_STAGES, 't16', customConfig, breakpoint, editor);
  const anchored = (stageId: string, layerId: string) => ({ ...a(stageId, layerId), ...sx(stageId, layerId) });
  const overlayProps = { breakpoint, config: customConfig, editor };
  const date = new Date(wedding.weddingDate);
  const dateText = formatEventDate(date, 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const brideFirst = t('general.brideFirst', 'true') !== 'false';
  const first = brideFirst ? wedding.brideName : wedding.groomName;
  const second = brideFirst ? wedding.groomName : wedding.brideName;
  const slotProps: SlotProps = { ...props, t, itinerary, tables, seatingEnabled, config: customConfig, editing: Boolean(editor?.enabled) };
  const gallery = orderedCoupleGallery(coupleMedia, customConfig['gallery.order']);
  const sections = ['welcome', 'walimah', 'rsvp', ...(itinerary.length ? ['itinerary'] : []),
    'wishes', ...(photoBoothEnabled ? ['photobooth'] : []), ...(gallery.length ? ['couple-gallery'] : [])];
  return <main className={styles.page} aria-label="Inkbound Revelry wedding invitation">
    <div className={styles.paper}>
      <section id="welcome" data-section="welcome" className={styles.welcome}>
        <SectionOverlay stageId="welcome" {...overlayProps} />
        <div className={styles.ribbon} style={a('welcome', 'ribbon')}><Ribbon /></div>
        <div className={styles.hero}>
          <p style={anchored('welcome', 'heading')}>{t('invite.heading', 'Together with our families')}</p>
          <p className={styles.eventTitle} style={anchored('welcome', 'eventTitle')}>{t('inkbound.eventTitle', 'The Wedding Celebration')}</p>
          <h1 style={a('welcome', 'names')}><span style={anchored('welcome', 'firstName')}>{first}</span><em style={anchored('welcome', 'connector')}>&</em><span style={anchored('welcome', 'secondName')}>{second}</span></h1>
          <p className={styles.date} style={anchored('welcome', 'date')}>{dateText}</p>
          {wedding.venue && <p className={styles.venue} style={anchored('welcome', 'venue')}>{wedding.venue}</p>}
          {t('general.showIslamicDate', 'false') === 'true' && <p style={anchored('welcome', 'islamicDate')}>{toHijriString(date)}</p>}
          <div className={styles.timer} style={a('welcome', 'countdown')}><TimerSlot {...slotProps} /></div>
        </div>
      </section>
      <section id="walimah" data-section="walimah" className={styles.ceremony}>
        <SectionOverlay stageId="walimah" {...overlayProps} />
        {t('walimah.body', '') && <div className={styles.medallion} style={a('walimah', 'medallion')}><Medallion /></div>}
        <div className={styles.ceremonyBody} style={a('walimah', 'content')}>
          {t('walimah.body', '') && <><h2 style={anchored('walimah', 'title')}>{t('walimah.title', 'Walimatul Urus')}</h2><div className={styles.richText} style={a('walimah', 'body')}><WalimahBodySlot {...slotProps} /></div></>}
          <p className={styles.red} style={anchored('walimah', 'date')}>{formatEventDate(date, 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {formatEventTime(date, 'en-GB', { hour: 'numeric', minute: '2-digit' })}</p>
          {wedding.venue && <p style={anchored('walimah', 'venue')}>{wedding.venue}<br />{wedding.venueAddress}</p>}
          <div style={a('walimah', 'actions')}><VenueActions wedding={wedding} t={t} /></div>
        </div>
      </section>
      <section id="rsvp" data-section="rsvp" className={styles.marginSection}>
        <SectionOverlay stageId="rsvp" {...overlayProps} />
        <div className={styles.trail} style={a('rsvp', 'trail')}><Trail envelopes /></div>
        <div className={styles.content} style={a('rsvp', 'content')}>
          <h2 style={anchored('rsvp', 'title')}>{t('rsvp.title', 'Join the celebration')}</h2><div className={styles.flourish} style={a('rsvp', 'flourish')}><Flourish /></div>
          <p style={anchored('rsvp', 'prompt')}>{t('rsvp.subtitle', 'Kindly reply before our celebration')}</p>
          <div style={a('rsvp', 'form')}><ReplyForm {...props} t={t} /></div>
        </div>
      </section>
      <section id="itinerary" data-section="itinerary" className={styles.marginSection} hidden={!itinerary.length}>
        <SectionOverlay stageId="itinerary" {...overlayProps} />
        <div className={styles.trail} style={a('itinerary', 'trail')}><Trail /></div>
        <div className={styles.content} style={a('itinerary', 'content')}><h2 style={anchored('itinerary', 'title')}>{t('itinerary.title', 'The order of the day')}</h2>
          <ol className={styles.programme} style={a('itinerary', 'programme')}>{itinerary.map((item) => <li key={item.itineraryItemId}>
            {item.detail && <p className={styles.red}>{item.detail}</p>}<p>{item.label}</p>
          </li>)}</ol>
        </div>
      </section>
      <section id="wishes" data-section="wishes" className={styles.wishes}>
        <SectionOverlay stageId="wishes" {...overlayProps} />
        <h2 style={anchored('wishes', 'title')}>{t('wish.title', 'Words to keep')}</h2><div className={styles.flourish} style={a('wishes', 'flourish')}><Flourish /></div>
        <p style={anchored('wishes', 'prompt')}>{t('wish.prompt', 'Leave a little joy for our next chapter')}</p>
        <div style={a('wishes', 'guestbook')}><Guestbook {...props} t={t} /></div>
        <div className={styles.note} style={a('wishes', 'note')}><Note /></div>
      </section>
      <section id="photobooth" data-section="photobooth" className={styles.marginSection} hidden={!photoBoothEnabled}>
        <SectionOverlay stageId="photobooth" {...overlayProps} />
        {photoBoothEnabled && <><div className={styles.flash} style={a('photobooth', 'flash')}><Flash /></div><div className={styles.content} style={a('photobooth', 'content')}>
          <h2 style={anchored('photobooth', 'title')}>{t('photobooth.title', 'Our shared moments')}</h2><div className={styles.flourish} style={a('photobooth', 'flourish')}><Flourish /></div>
          <p style={anchored('photobooth', 'prompt')}>{t('photobooth.prompt', 'Share a photograph from the day')}</p><div style={a('photobooth', 'album')}><Album {...props} t={t} /></div>
        </div></>}
      </section>
    </div>
    <CoupleGallery photos={gallery} title={t('gallery.title', 'Our photos')} fit={t('gallery.fit', 'cover')} layout={t('gallery.layout', 'grid')} />
    <SectionNavigation sections={sections} config={customConfig} />
    <MusicSlot t={t} editing={Boolean(editor?.enabled)} autoPlay={false} />
  </main>;
}

function VenueActions({ wedding, t }: Pick<TemplateRenderProps, 'wedding'> & { t: Copy }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const links = calendarLinks(wedding);
  return <div className={styles.actions}>
    {t('general.showVenueMap', 'false') === 'true' && (wedding.venue || wedding.venueAddress) && <a className={styles.button} href={`https://maps.google.com/?q=${encodeURIComponent(wedding.venueAddress || wedding.venue || '')}`} target="_blank" rel="noopener noreferrer">{t('ceremony.map_label', 'View Map')}</a>}
    {t('general.showAddToCalendar', 'false') === 'true' && <button type="button" className={styles.outlineButton} aria-expanded={showCalendar} onClick={() => setShowCalendar(!showCalendar)}>{t('ceremony.calendar_label', 'Add to Calendar')}</button>}
    {showCalendar && <div className={styles.calendar}><a href={links.google} target="_blank" rel="noopener noreferrer">Google Calendar</a><a href={links.ical} download="wedding.ics">Apple Calendar</a><a href={links.outlook} target="_blank" rel="noopener noreferrer">Outlook</a></div>}
  </div>;
}

function ReplyForm({ wedding, onRSVP, seatingEnabled = false, tables = [], editor, previewOnly, t }: TemplateRenderProps & { t: Copy }) {
  const submission = useGuestSubmission();
  const [form, setForm] = useState({ guestName: '', email: '', phoneNumber: '', brideOrGroomSide: 'Bride' as 'Bride' | 'Groom', numberOfAttendees: 1, isAttending: true, songRequest: '' });
  const [step, setStep] = useState<'form' | 'seating'>('form');
  const seatingPreview = useContext(SeatingPreviewContext);
  const visibleStep = seatingPreview ? 'seating' : step;
  const [tableId, setTableId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const max = guestLimit(wedding);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (wedding.isRsvpOpen === false || busy) return;
    if (form.isAttending && seatingEnabled && visibleStep === 'form') { setStep('seating'); return; }
    if (editor?.enabled || previewOnly) { setError('Preview only — no RSVP was submitted.'); return; }
    setBusy(true);
    try {
      if (!await submission.submit(() => onRSVP(normalizeRsvp({ ...form, tableId: seatingEnabled && form.isAttending ? tableId : null }, wedding, tables)), 'We could not send your RSVP. Please try again.', setError)) return; setDone(true);
    } catch { setError('We could not send your RSVP. Please try again.'); }
    finally { setBusy(false); }
  };
  if (wedding.isRsvpOpen === false && !seatingPreview) return <p role="status">{t('rsvp.closed_message', 'RSVPs are closed — thank you for your interest.')}</p>;
  if (done && !seatingPreview) return <p role="status">{t('rsvp.done_message', 'Thank you. We look forward to celebrating with you.')}</p>;
  return <form onSubmit={submit} className={styles.form}>
    {visibleStep === 'form' ? <>
      <label>Full name<input required autoComplete="name" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></label>
      <label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Phone<input type="tel" autoComplete="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></label>
      <fieldset><legend className={styles.srOnly}>Side of the family</legend>{(['Bride', 'Groom'] as const).map((side) => <label className={styles.choice} key={side}><input type="radio" name="family-side" checked={form.brideOrGroomSide === side} onChange={() => setForm({ ...form, brideOrGroomSide: side })} />{t(`rsvp.${side.toLowerCase()}_side_label`, `${side}’s side`)}</label>)}</fieldset>
      <label>Number of guests<input type="number" min={1} max={max} required value={form.numberOfAttendees} onChange={(e) => { setTableId(null); setForm({ ...form, numberOfAttendees: Math.max(1, Math.min(max, Number(e.target.value) || 1)) }); }} /></label>
      <fieldset><legend className={styles.srOnly}>Attendance</legend>{[true, false].map((attending) => <label className={styles.choice} key={String(attending)}><input type="radio" name="attendance" checked={form.isAttending === attending} onChange={() => setForm({ ...form, isAttending: attending })} />{attending ? t('rsvp.attending_label', 'Joyfully accept') : t('rsvp.declining_label', 'Regretfully decline')}</label>)}</fieldset>
      <label>Song request (optional)<textarea rows={2} value={form.songRequest} onChange={(e) => setForm({ ...form, songRequest: e.target.value })} /></label>
    </> : <><div><h3>{t('rsvp.seating_prompt', 'Choose your table')}</h3>
      {!tables.length && <p>No tables have been set up yet — your seat will be assigned by the couple.</p>}
      <div className={styles.tableGrid}>{tables.map((table) => {
        const available = seatsAvailable(table);
        return <button key={table.tableId} type="button" className={styles.outlineButton} disabled={!tableCanFit(table, form.numberOfAttendees)}
          aria-pressed={tableId === table.tableId} onClick={() => setTableId(table.tableId)}>
          {table.tableName} · {available < form.numberOfAttendees ? 'Not enough seats' : `${available} seats left`}
        </button>;
      })}</div></div><button type="button" className={styles.textButton} onClick={() => { setStep('form'); seatingPreview?.dismiss(); }}>{t('rsvp.seating_back_label', 'Back')}</button></>}
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={busy} className={styles.button}>{busy ? 'Sending…' : form.isAttending && seatingEnabled && visibleStep === 'form' ? t('rsvp.continue_label', 'Continue') : t('rsvp.submit_label', 'Send RSVP')}</button>
  </form>;
}

function Guestbook({ onSubmitWish, wishes, editor, previewOnly, t }: TemplateRenderProps & { t: Copy }) {
  const submission = useGuestSubmission();
  const [form, setForm] = useState({ guestName: '', message: '' });
  const { limit: shown, loadMore: loadMoreWishes } = useWishPagination();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const send = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setError(''); setStatus('');
    if (editor?.enabled || previewOnly) { setStatus('Preview only — no wish was submitted.'); return; }
    setBusy(true);
    try { if (!await submission.submit(() => onSubmitWish(form), 'We could not send your wish. Please try again.', setError)) return; setForm({ guestName: '', message: '' }); setStatus(t('wish.sent_message', 'Thank you — your wish was sent.')); }
    catch { setError('We could not send your wish. Please try again.'); }
    finally { setBusy(false); }
  };
  return <><form className={styles.form} onSubmit={send}>
    <label>{t('wish.form_title', 'Leave a Wish')}<textarea rows={4} maxLength={1000} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
    <label>Your name<input autoComplete="name" maxLength={100} required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></label>
    <button disabled={busy} type="submit" className={styles.button}>{busy ? 'Sending…' : t('wish.submit_label', 'Send Wish')}</button>
    {status && <p role="status">{status}</p>}{error && <p role="alert">{error}</p>}
  </form><div className={styles.messages}>
    {!wishes.length && <p>No wishes yet — be the first to write one.</p>}
    {wishes.slice(0, shown).map((wish) => <blockquote key={wish.wishId}><p className={styles.red}><i>{wish.guestName}</i> —</p><p>{wish.message}</p></blockquote>)}
    {wishes.length > shown && <button type="button" className={styles.textButton} onClick={loadMoreWishes}>Load more ({wishes.length - shown} remaining)</button>}
  </div></>;
}

function Album({ photos, onUploadPhoto, editor, previewOnly, t }: TemplateRenderProps & { t: Copy }) {
  const submission = useGuestSubmission();
  const inputId = useId();
  const [layout, setLayout] = useState<'stack' | 'grid'>('stack');
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const active = Math.min(index, Math.max(0, photos.length - 1));
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? '';
  useEffect(() => {
    if (opened !== null) { dialog.current?.showModal(); closeButton.current?.focus(); }
    else if (dialog.current?.open) dialog.current.close();
  }, [opened]);
  const upload = async (file?: File) => {
    if (!file || !onUploadPhoto || busy) return;
    setError(''); setStatus('');
    if (editor?.enabled || previewOnly) { setStatus('Preview only — no photo was uploaded.'); return; }
    setBusy(true);
    try { if (!await submission.submit(() => uploadPhotoFile(onUploadPhoto, file), 'We could not upload your photo. Please try again.', setError)) return; setStatus('Your photo was uploaded.'); }
    catch { setError('We could not upload your photo. Please try again.'); }
    finally { setBusy(false); }
  };
  return <>
    {onUploadPhoto && <div className={styles.upload}><label className={styles.button} htmlFor={inputId}>{busy ? 'Uploading…' : t('photobooth.upload_label', 'Upload a Photo')}</label><input id={inputId} className={styles.fileInput} type="file" accept="image/*" disabled={busy} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></div>}
    {error && <p role="alert">{error}</p>}{status && <p role="status">{status}</p>}
    {photos.length > 1 && <div className={styles.galleryControls}>
      <button type="button" aria-pressed={layout === 'stack'} onClick={() => setLayout('stack')}>Stack</button><button type="button" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}>Grid</button>
      {layout === 'stack' && <><button type="button" aria-label="Previous photo" onClick={() => setIndex((active - 1 + photos.length) % photos.length)}>‹</button><button type="button" aria-label="Next photo" onClick={() => setIndex((active + 1) % photos.length)}>›</button></>}
    </div>}
    {!photos.length && <p className={styles.empty}>Our album is waiting for its first memory.</p>}
    <div className={layout === 'grid' ? styles.galleryGrid : styles.galleryStack}>
      {(layout === 'grid' ? photos : photos.slice(active, active + 1)).map((photo) => <figure key={photo.photoId}>
        <button type="button" className={styles.photoButton} onClick={() => setOpened(photos.indexOf(photo))} aria-label={`Open ${photo.caption || 'guest photo'}`}><img src={`${base}${photo.photoUrl}`} alt={photo.caption || 'Guest photo'} loading="lazy" /></button>
        {photo.caption && <figcaption>{photo.caption}</figcaption>}
      </figure>)}
    </div>
    <dialog ref={dialog} className={styles.lightbox} aria-label="Guest photograph" onClose={() => setOpened(null)} onCancel={() => setOpened(null)}>
      <button ref={closeButton} type="button" onClick={() => setOpened(null)}>Close photograph</button>
      {opened !== null && photos[opened] && <><img src={`${base}${photos[opened].photoUrl}`} alt={photos[opened].caption || 'Guest photo'} /><p>{photos[opened].caption}</p></>}
    </dialog>
  </>;
}
