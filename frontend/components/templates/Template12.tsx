'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Wedding, Wish, Photo, ItineraryItem, SeatingTable } from '@/lib/api';
import { resolveSectionOrder, toHijriString, type SectionCode } from '@/lib/templateUtils';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useParallax } from '@/components/templates/_shared/hooks/useParallax';
import { useBreakpoint } from '@/components/templates/_shared/hooks/useBreakpoint';
import { FlowBackground } from '@/components/templates/_shared/FlowBackground';
import type { EditorHandle, SlotProps } from '@/components/templates/_shared/types';
import { EngineProvider } from '@/components/templates/_shared/engine';
import { useStageLayout } from '@/components/templates/_shared/layout';
import Layer from '@/components/templates/_shared/Layer';
import SheetHost from '@/components/templates/_shared/SheetHost';
import { SLOT_AVAILABLE, SLOT_REGISTRY, sheetLayerGroups } from '@/components/templates/_shared/slots';
import { SlotFlowProviders } from '@/components/templates/_shared/slots/FlowProviders';
import { fontVar } from '@/lib/fonts/registry';
import { StageSection } from './Template12-dreamywoodland/StageSection';
import { useAnchors } from './Template12-dreamywoodland/useAnchors';
import { T12_STAGES } from './Template12-dreamywoodland/data/dreamyWoodlandStages';
import styles from './Template12-dreamywoodland/Template12.module.css';

function useCountdown(target: string) {
  const [left, setLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return setLeft(null);
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

interface Template12Props {
  wedding: Wedding;
  onRSVP: SlotProps['onRSVP'];
  onSubmitWish: SlotProps['onSubmitWish'];
  onUploadPhoto?: SlotProps['onUploadPhoto'];
  wishes: Wish[];
  photos: Photo[];
  photoBoothEnabled: boolean;
  customConfig?: Record<string, string>;
  itinerary?: ItineraryItem[];
  seatingEnabled?: boolean;
  tables?: SeatingTable[];
  editor?: EditorHandle;
}

const ENGINE = { assetRoot: '/templates/dreamy-woodland', assetSizes: {}, slotRegistry: SLOT_REGISTRY };

export default function Template12({
  wedding, onRSVP, onSubmitWish, onUploadPhoto, wishes, photos, photoBoothEnabled,
  customConfig, itinerary = [], seatingEnabled = false, tables = [], editor,
}: Template12Props) {
  const t = useCallback((key: string, fallback: string) => {
    const configured = customConfig?.[key];
    if (configured) return configured;
    // The shared gallery defaults to T7's engraved Roman frame. Dreamy Woodland deliberately
    // ships the clean card so public invites match the editor even before a starting-design row
    // has been captured for the template.
    if (key === 'photobooth.frameArt') return 'none';
    return fallback;
  }, [customConfig]);
  const sectionOrder = resolveSectionOrder(customConfig?.['section.order'], true, itinerary.length > 0, photoBoothEnabled);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useParallax(rootRef, 'on', reduced);

  const editing = Boolean(editor?.enabled);
  const breakpoint = useBreakpoint(editing ? editor!.breakpoint : undefined);
  const { a, sx } = useAnchors(customConfig, breakpoint, editor);
  const overlayProps = { breakpoint, config: customConfig, editor };
  const defaultPageBgParallax = breakpoint === 'mobile' ? 0.12 : 0.22;
  const configuredPageBgParallax = Number(customConfig?.['t12.layout.pageBg.parallaxRate']);
  const pageBgParallax = Number.isFinite(configuredPageBgParallax)
    ? Math.min(1, Math.max(0, configuredPageBgParallax))
    : defaultPageBgParallax;
  const pageBgSrc = customConfig?.['t12.layout.pageBg.src']
    || '/templates/dreamy-woodland/backgrounds-v2/flow-clouds-v2.webp';
  const date = new Date(wedding.weddingDate);
  const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const countdown = useCountdown(wedding.weddingDate);
  const showIslamicDate = customConfig?.['general.showIslamicDate'] === 'true';

  const slotTheme: CSSProperties = {
    '--slot-ink': '#007f78',
    '--slot-ink-soft': 'rgba(0, 127, 120, 0.76)',
    '--slot-ink-faint': 'rgba(0, 127, 120, 0.5)',
    '--slot-rule': 'rgba(0, 127, 120, 0.2)',
    '--slot-accent': t('t12.layout.slotTheme.accentColor', '#ed7f93'),
    '--slot-accent-ink': '#f2efe8',
    '--slot-radius': '2px',
    '--slot-font-display': fontVar(customConfig?.['t12.layout.slotTheme.headingFont']) ?? 'var(--font-ae-cormorant), Georgia, serif',
    '--slot-font-serif': fontVar(customConfig?.['t12.layout.slotTheme.bodyFont']) ?? 'var(--font-ae-eb-garamond), Georgia, serif',
    '--slot-font-body': fontVar(customConfig?.['t12.layout.slotTheme.bodyFont']) ?? 'var(--font-ae-eb-garamond), Georgia, serif',
    '--slot-panel-bg': 'radial-gradient(ellipse at center, rgba(242,239,232,.96) 0%, rgba(242,239,232,.82) 58%, transparent 86%)',
    '--slot-panel-shadow': 'none',
  } as CSSProperties;

  const slotProps: SlotProps = useMemo(() => ({
    wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
    onRSVP, onSubmitWish, onUploadPhoto, editing, config: customConfig, breakpoint, editor,
  }), [wedding, t, wishes, photos, tables, itinerary, seatingEnabled, photoBoothEnabled,
    onRSVP, onSubmitWish, onUploadPhoto, editing, customConfig, breakpoint, editor]);

  const stages = useStageLayout('t12', T12_STAGES, sectionOrder, breakpoint, customConfig);
  const sheets = useMemo(() => sheetLayerGroups(stages, slotProps), [stages, slotProps]);

  const flowSlotsFor = (stageId: string) => {
    const stage = stages.find((item) => item.def.id === stageId);
    if (!stage) return null;
    const active = editing && editor?.selectedStage === stageId;
    return stage.layers
      .filter((layer) => layer.kind === 'slot' && layer.presentation !== 'sheet' && !layer.hidden
        && (!layer.slot || SLOT_AVAILABLE[layer.slot]?.(slotProps)))
      .sort((left, right) => left.order - right.order)
      .map((layer) => <Layer key={layer.id} layer={layer} slotProps={{ ...slotProps, stageLayers: stage.layers }}
        eager={false} flow editing={editing} stageActive={active} stageId={stageId}
        selected={active && editor?.selectedLayer === layer.id} />);
  };

  const scrollTo = (code: SectionCode) => document.getElementById(code)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });

  return (
    <SlotFlowProviders>
      <EngineProvider value={ENGINE}>
        <div ref={rootRef} className={styles.root} style={slotTheme}>
          <FlowBackground src={pageBgSrc} tileWidth={1024} tileHeight={1536} parallaxRate={pageBgParallax} />
          {sectionOrder.map((code) => {
            if (code === 'welcome') return (
              <StageSection key={code} code={code} {...overlayProps} extra={
                <button className={styles.scrollCue} onClick={() => scrollTo(sectionOrder[1] ?? 'rsvp')} aria-label="Continue to invitation details">↓</button>
              }>
                <p className={styles.invitationLine} style={{ ...a('welcome', 'themeLabel'), ...sx('welcome', 'themeLabel') }}>
                  {t('invite.heading', 'Together with their families')}
                </p>
                <h1 className={styles.heading}>
                  <span style={{ ...a('welcome', 'nameFirst'), ...sx('welcome', 'nameFirst') }}>{wedding.brideName}</span>
                  <span className={styles.amp}>&amp;</span>
                  <span style={{ ...a('welcome', 'nameSecond'), ...sx('welcome', 'nameSecond') }}>{wedding.groomName}</span>
                </h1>
                <p className={styles.date} style={{ ...a('welcome', 'date'), ...sx('welcome', 'date') }}>{dateLabel}</p>
                {showIslamicDate && <p className={styles.hijri} style={{ ...a('welcome', 'hijri'), ...sx('welcome', 'hijri') }}>{toHijriString(date)}</p>}
                {countdown && <div className={styles.countdown} style={a('welcome', 'timer')}>
                  {([['days', countdown.days], ['hours', countdown.hours], ['minutes', countdown.minutes], ['seconds', countdown.seconds]] as const)
                    .map(([label, value]) => <div className={styles.countUnit} key={label}>
                      <span className={styles.countNum} style={sx('welcome', 'timer')}>{String(value).padStart(2, '0')}</span>
                      <span className={styles.countLabel}>{label}</span>
                    </div>)}
                </div>}
                <div className={styles.body} style={{ ...a('welcome', 'venue'), ...sx('welcome', 'venue') }}>
                  {wedding.venue}<br />{wedding.venueAddress}
                </div>
              </StageSection>
            );

            if (code === 'walimah') return (
              <StageSection key={code} code={code} {...overlayProps}>
                <h2 className={styles.sectionTitle} style={{ ...a('walimah', 'title'), ...sx('walimah', 'title') }}>
                  {t('walimah.title', 'Our Wedding Celebration')}
                </h2>
                {customConfig?.['walimah.body']
                  ? <div className={styles.body} dangerouslySetInnerHTML={{ __html: customConfig['walimah.body'] }} />
                  : <div className={styles.body}>We would be delighted by your presence as we begin our life together.<br /><br />{dateLabel}<br />{wedding.venue}</div>}
              </StageSection>
            );

            if (code === 'rsvp' || code === 'itinerary' || code === 'wishes' || code === 'photobooth') return (
              <StageSection key={code} code={code} {...overlayProps} panelless>{flowSlotsFor(code)}</StageSection>
            );
            return null;
          })}
          <footer className={styles.footer}>{t('footer.tagline', 'With love, and with joy')}</footer>
          <SheetHost groups={sheets} slotProps={slotProps} editor={editor} />
        </div>
      </EngineProvider>
    </SlotFlowProviders>
  );
}
