'use client';

import { cloneElement, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { resolveBindings } from '@/components/templates/_shared/bindings';
import type { EditorHandle, Layer, SlotProps } from './types';
import { staggerDelay } from '@/components/templates/_shared/reveal';
import { subLayerStyle, subLayersOf } from '@/components/templates/_shared/slots/subLayerStyle';
import { CurvedPiece, curvedTextOf } from '@/components/templates/_shared/slots/CurvedPiece';
import { useSheets } from '@/components/templates/_shared/slots/sheets';
import { useEngine } from '@/components/templates/_shared/engine';
import { WishListSlot } from '@/components/templates/_shared/slots/WishSlots';
import PhotoBoothSlot from '@/components/templates/_shared/slots/PhotoBoothSlot';
import styles from './DinoSlots.module.css';

function useCountdown(target: string) {
  const [left, setLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return setLeft(null);
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
      });
    };
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, [target]);
  return left;
}

function Piece({ layer, editor, id, children }: {
  layer?: Layer;
  editor?: EditorHandle;
  id: string;
  children: ReactElement;
}) {
  const { assetRoot } = useEngine();
  if (layer?.hidden) return null;
  const dx = (layer?.x ?? 50) - 50;
  const dy = (layer?.y ?? 50) - 50;
  const scale = layer?.s ?? 1;
  const transform = dx || dy || scale !== 1 ? `translate(${dx}%, ${dy}%) scale(${scale})` : undefined;
  const anim = layer?.anim || 'rise';
  const animOut = layer?.animOut && layer.animOut !== 'none' ? layer.animOut : undefined;
  const selected = Boolean(editor?.enabled && editor.selectedLayer === id);
  // Shape (arc/circle) from the Style tab — see CurvedPiece.tsx.
  const curveText = curvedTextOf(layer, children);
  const childStyle = (children.props as { style?: CSSProperties }).style ?? {};
  const child = curveText !== undefined
    ? <CurvedPiece layer={layer!} text={curveText} anim={anim} />
    : cloneElement(children as ReactElement<Record<string, unknown>>, {
    'data-sl-anim': anim,
    'data-scroll-fade': anim === 'scroll-fade' ? true : undefined,
    style: {
      ...childStyle,
      ...subLayerStyle(layer, assetRoot),
      '--sl-opacity': layer?.opacity ?? 1,
      '--sl-delay': staggerDelay(layer?.order ?? 0),
      ...(layer?.animDur ? { '--sl-dur': `${layer.animDur}s` } : {}),
    } as CSSProperties,
  });

  return (
    <div style={{ transform, ...(selected ? { outline: '2px dashed #f3bd45', outlineOffset: 3 } : {}) }}>
      {animOut ? <div data-scroll-exit data-sl-out={animOut}>{child}</div> : child}
    </div>
  );
}

function usePieces(stageLayers: Layer[] | undefined, parentId: string | undefined) {
  return useMemo(() => subLayersOf(stageLayers, parentId), [stageLayers, parentId]);
}

function bound(props: SlotProps, sub: Record<string, Layer>, id: string, fallback: string) {
  return resolveBindings(sub[id]?.text ?? fallback, props);
}

export function DinoHeroSlot(props: SlotProps) {
  const { wedding, stageLayers, layer, editor } = props;
  const sub = usePieces(stageLayers, layer?.id ?? 'hero');
  const units = usePieces(stageLayers, 'hero-timer');
  const left = useCountdown(wedding.weddingDate);
  return (
    <div className={`${styles.composite} ${styles.hero}`}>
      <Piece layer={sub['hero-eyebrow']} editor={editor} id="hero-eyebrow"><p className={styles.eyebrow}>{bound(props, sub, 'hero-eyebrow', 'Welcome to the Expedition')}</p></Piece>
      <Piece layer={sub['hero-title']} editor={editor} id="hero-title"><p className={styles.heroTitle}>{bound(props, sub, 'hero-title', 'The Roarsome Birthday')}</p></Piece>
      <Piece layer={sub['hero-honoree']} editor={editor} id="hero-honoree"><h1 className={styles.honoree}>{bound(props, sub, 'hero-honoree', '{{name1}}')}</h1></Piece>
      <Piece layer={sub['hero-age']} editor={editor} id="hero-age"><p className={styles.age}>{bound(props, sub, 'hero-age', 'Turns 7')}</p></Piece>
      <Piece layer={sub['hero-date']} editor={editor} id="hero-date"><p className={styles.detailLine}>{bound(props, sub, 'hero-date', '{{date:long}} · {{time}}')}</p></Piece>
      <Piece layer={sub['hero-venue']} editor={editor} id="hero-venue"><p className={styles.detailLine}>{bound(props, sub, 'hero-venue', '{{venue}}')}</p></Piece>
      {left && (
        <Piece layer={sub['hero-timer']} editor={editor} id="hero-timer">
          <div className={styles.countdown}>
            {/* Each unit is its own sub-layer of `hero-timer`, so a couple can nudge, restyle,
                back with a plate or hide Days/Hours/Minutes individually — the group itself still
                moves them as one. `units` resolves children of hero-timer, not of hero. */}
            {([['hero-timer-days', 'Days', left.days], ['hero-timer-hours', 'Hours', left.hours], ['hero-timer-minutes', 'Minutes', left.minutes]] as const).map(([pid, label, value]) => (
              <Piece key={pid} layer={units[pid]} editor={editor} id={pid}>
                <span className={styles.countUnit}>
                  <strong>{String(value).padStart(2, '0')}</strong>
                  <small>{units[pid]?.text ?? label}</small>
                </span>
              </Piece>
            ))}
          </div>
        </Piece>
      )}
      <Piece layer={sub['hero-cue']} editor={editor} id="hero-cue"><p className={styles.cue}>{bound(props, sub, 'hero-cue', 'Scroll to begin')} <span aria-hidden>⌄</span></p></Piece>
    </div>
  );
}

export function DinoDetailsSlot(props: SlotProps) {
  const { stageLayers, layer, editor } = props;
  const sub = usePieces(stageLayers, layer?.id ?? 'details');
  return (
    <div className={`${styles.composite} ${styles.details}`}>
      <Piece layer={sub['details-title']} editor={editor} id="details-title"><h2 className={styles.sectionTitle}>{bound(props, sub, 'details-title', 'Expedition Briefing')}</h2></Piece>
      <Piece layer={sub['details-body']} editor={editor} id="details-body"><p className={styles.copy}>{bound(props, sub, 'details-body', '{{walimah.body}}')}</p></Piece>
      <div className={styles.factGrid}>
        <Piece layer={sub['details-date']} editor={editor} id="details-date"><p className={styles.fact}><small>Date</small>{bound(props, sub, 'details-date', '{{date:long}}')}</p></Piece>
        <Piece layer={sub['details-time']} editor={editor} id="details-time"><p className={styles.fact}><small>Time</small>{bound(props, sub, 'details-time', '{{time}}')}</p></Piece>
        <Piece layer={sub['details-venue']} editor={editor} id="details-venue"><p className={styles.fact}><small>Basecamp</small>{bound(props, sub, 'details-venue', '{{venue}}')}</p></Piece>
      </div>
      <Piece layer={sub['details-note']} editor={editor} id="details-note"><p className={styles.note}>{bound(props, sub, 'details-note', 'Adventure gear encouraged')}</p></Piece>
    </div>
  );
}

export function DinoItinerarySlot(props: SlotProps) {
  const { itinerary, stageLayers, layer, editor } = props;
  const sub = usePieces(stageLayers, layer?.id ?? 'itinerary');
  const timeStyle = subLayerStyle(sub['itin-time']);
  const titleStyle = subLayerStyle(sub['itin-title']);
  return (
    <div className={`${styles.composite} ${styles.itinerary}`}>
      <Piece layer={sub['itinerary-title']} editor={editor} id="itinerary-title"><h2 className={styles.sectionTitle}>{bound(props, sub, 'itinerary-title', 'Adventure Route')}</h2></Piece>
      <Piece layer={sub['itinerary-list']} editor={editor} id="itinerary-list">
        <ol className={styles.routeList}>
          {itinerary.map((item) => <li key={item.itineraryItemId}><time style={timeStyle}>{item.detail}</time><strong style={titleStyle}>{item.label}</strong></li>)}
        </ol>
      </Piece>
    </div>
  );
}

export function DinoRsvpSlot(props: SlotProps) {
  const { stageLayers, layer, editor, seatingEnabled, editing } = props;
  const sub = usePieces(stageLayers, layer?.id ?? 'rsvp');
  const { open } = useSheets();
  const activate = () => { if (!editing) open('rsvp'); };
  return (
    <div className={`${styles.composite} ${styles.actionSection}`}>
      <Piece layer={sub['rsvp-title']} editor={editor} id="rsvp-title"><h2 className={styles.sectionTitle}>{bound(props, sub, 'rsvp-title', 'Join the Expedition')}</h2></Piece>
      <Piece layer={sub['rsvp-prompt']} editor={editor} id="rsvp-prompt"><p className={styles.copy}>{bound(props, sub, 'rsvp-prompt', 'Will your explorer be joining the crew?')}</p></Piece>
      <Piece layer={sub['rsvp-trigger']} editor={editor} id="rsvp-trigger"><button type="button" className={styles.actionButton} onClick={activate}>{bound(props, sub, 'rsvp-trigger', 'Confirm attendance')}</button></Piece>
      <Piece layer={sub['rsvp-deadline']} editor={editor} id="rsvp-deadline"><p className={styles.note}>{bound(props, sub, 'rsvp-deadline', 'Reply by 10 October')}</p></Piece>
      {seatingEnabled && <Piece layer={sub['rsvp-seating']} editor={editor} id="rsvp-seating"><button type="button" className={styles.textButton} onClick={activate}>{bound(props, sub, 'rsvp-seating', 'Check your seat')}</button></Piece>}
    </div>
  );
}

export function DinoWishesSlot(props: SlotProps) {
  const { stageLayers, layer, editor, editing } = props;
  const sub = usePieces(stageLayers, layer?.id ?? 'wishes');
  const { open } = useSheets();
  return (
    <div className={`${styles.composite} ${styles.actionSection}`}>
      <Piece layer={sub['wishes-title']} editor={editor} id="wishes-title"><h2 className={styles.sectionTitle}>{bound(props, sub, 'wishes-title', 'Field Notes')}</h2></Piece>
      <Piece layer={sub['wishes-prompt']} editor={editor} id="wishes-prompt"><p className={styles.copy}>{bound(props, sub, 'wishes-prompt', 'Leave a birthday message for the expedition journal.')}</p></Piece>
      <Piece layer={sub['wishes-trigger']} editor={editor} id="wishes-trigger"><button type="button" className={styles.actionButton} onClick={() => { if (!editing) open('wish'); }}>{bound(props, sub, 'wishes-trigger', 'Write a wish')}</button></Piece>
      <Piece layer={sub['wishes-list']} editor={editor} id="wishes-list"><div className={styles.wishList}><WishListSlot {...props} /></div></Piece>
    </div>
  );
}

export function DinoPhotoBoothSlot(props: SlotProps) {
  const { stageLayers, layer, editor } = props;
  const sub = usePieces(stageLayers, layer?.id ?? 'photobooth');
  return (
    <div className={`${styles.composite} ${styles.photoBooth}`}>
      <Piece layer={sub['photobooth-title']} editor={editor} id="photobooth-title"><h2 className={styles.sectionTitle}>{bound(props, sub, 'photobooth-title', 'Expedition Photos')}</h2></Piece>
      <Piece layer={sub['photobooth-prompt']} editor={editor} id="photobooth-prompt"><p className={styles.copy}>{bound(props, sub, 'photobooth-prompt', 'Capture a memory from the wild.')}</p></Piece>
      <div className={styles.galleryWrap}><PhotoBoothSlot {...props} /></div>
    </div>
  );
}
