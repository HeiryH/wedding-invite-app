'use client';

import Link from 'next/link';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { parseEventTypes } from '@/lib/eventTypes';
import { templateService, Template, landingService, LandingDto, LandingItemDto } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { TemplateMarquee } from '@/components/marketing/TemplateMarquee';
import { Wordmark } from '@/components/marketing/Wordmark';
import { InviteSteps } from '@/components/marketing/InviteSteps';
import { LANDING_CONTENT_DEFAULTS, DEFAULT_STORY_ITEMS, DEFAULT_PRICING_ITEMS, DEFAULT_MIDDLE_SECTIONS, LandingDefaultItem } from '@/lib/landing/defaults';
import { LANDING_MENU_KEY, LANDING_MENU_SECTIONS, readLandingMenu } from '@/lib/landing/menu';

const SECTION_PAD = 'clamp(56px, 8vw, 96px) clamp(20px, 5vw, 72px)';
const EXPLORE_BOTTOM_PAD = 'clamp(24px, 3vw, 36px)';
const DEFAULT_MIDDLE = DEFAULT_MIDDLE_SECTIONS;
const CTA_MORPH_DURATION_MS = 350;
const MENU_CTA_MORPH_DURATION_MS = 450;
const CTA_ICON_SIZE = 100;
const CTA_DISC_SIZE = 62;
const CTA_RING_RADIUS = 35;
const CTA_RING_FONT_SIZE = 11.5;
const CTA_RING_TEXT_LENGTH = 210;
const CTA_RING_TEXT = '• Create Now • Explore Design';
const CTA_RING_ROTATION_SECONDS = 14;
const CTA_STAR_ROTATION_SECONDS = 8;
const CTA_RING_CENTER = CTA_ICON_SIZE / 2;
const CTA_RING_PATH = `M${CTA_RING_CENTER} ${CTA_RING_CENTER - CTA_RING_RADIUS} a${CTA_RING_RADIUS} ${CTA_RING_RADIUS} 0 1 1 0 ${CTA_RING_RADIUS * 2} a${CTA_RING_RADIUS} ${CTA_RING_RADIUS} 0 1 1 0 ${-CTA_RING_RADIUS * 2}`;
const CTA_CORNER_GAP = 24;
const MENU_CTA_LABEL = 'Try for free';
const CTA_ANCHORS = {
  hero: { label: 'Create Now', fontSize: 21 },
  explore: { label: 'View all designs', fontSize: 17 },
  bottom: { label: 'Make your first invite', fontSize: 19 },
} as const;
type CtaAnchor = keyof typeof CTA_ANCHORS;
type CtaStop = CtaAnchor | 'corner' | 'cornerLeft' | 'menu';
const CTA_ANCHOR_STOPS: CtaAnchor[] = ['hero', 'explore', 'bottom'];

function ctaWeights(stop: CtaStop): Record<CtaStop, number> {
  return { hero: Number(stop === 'hero'), explore: Number(stop === 'explore'), bottom: Number(stop === 'bottom'), corner: Number(stop === 'corner'), cornerLeft: Number(stop === 'cornerLeft'), menu: Number(stop === 'menu') };
}

export default function HomePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [landing, setLanding] = useState<LandingDto | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const scheduleCta = useRef<(() => void) | null>(null);
  const router = useRouter();
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const exploreCtaRef = useRef<HTMLAnchorElement>(null);
  const bottomCtaRef = useRef<HTMLButtonElement>(null);
  const menuCtaRef = useRef<HTMLButtonElement>(null);
  const floatingCtaRef = useRef<HTMLButtonElement>(null);
  const ctaLabelRef = useRef<HTMLSpanElement>(null);
  const menuCtaLabelRef = useRef<HTMLSpanElement>(null);
  const ctaIconRef = useRef<HTMLSpanElement>(null);
  const ctaTextPathId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    let target: CtaStop | undefined;
    let weights = ctaWeights('corner');
    let from = weights;
    let startedAt = 0;
    let duration = CTA_MORPH_DURATION_MS;
    let animating = false;
    const update = (now: number) => {
      frame = 0;
      const heroButton = heroCtaRef.current;
      const exploreLink = exploreCtaRef.current;
      const bottomButton = bottomCtaRef.current;
      const menuButton = menuCtaRef.current;
      const floating = floatingCtaRef.current;
      const label = ctaLabelRef.current;
      const menuLabel = menuCtaLabelRef.current;
      const icon = ctaIconRef.current;
      if (!heroButton || !menuButton || !floating || !label || !menuLabel || !icon) return;

      const anchors = {
        hero: heroButton.getBoundingClientRect(),
        explore: exploreLink?.getBoundingClientRect(),
        bottom: bottomButton?.getBoundingClientRect(),
      };
      const viewportHeight = window.innerHeight;
      const heroStart = reduceMotion ? 0 : viewportHeight * 0.8;
      const lowerEdge = viewportHeight - CTA_CORNER_GAP;
      const inView = (box?: DOMRect) => !!box && box.top >= CTA_CORNER_GAP && box.bottom <= lowerEdge;

      const exploreTop = 300;
      const exploreBottom = viewportHeight - 20;
      const exploreInView =
        !!anchors.explore &&
        anchors.explore.top >= exploreTop &&
        anchors.explore.bottom <= exploreBottom;

      const pastExplore = !!anchors.explore && anchors.explore.top < exploreTop;
      const nextTarget: CtaStop = menuOpenRef.current ? 'menu'
        : anchors.hero.bottom > heroStart ? 'hero'
        : exploreInView ? 'explore'
        : inView(anchors.bottom) ? 'bottom'
        : pastExplore ? 'cornerLeft' : 'corner';

      if (target === undefined || reduceMotion) {
        target = nextTarget;
        weights = ctaWeights(target);
        animating = false;
      } else if (target !== nextTarget) {
        // Start a reversal from the currently painted shape.
        from = weights;
        duration = nextTarget === 'menu' || weights.menu > 0 ? MENU_CTA_MORPH_DURATION_MS : CTA_MORPH_DURATION_MS;
        target = nextTarget;
        startedAt = now;
        animating = true;
      }

      if (animating) {
        const elapsed = Math.min(1, (now - startedAt) / duration);
        const eased = elapsed ** 3 * (elapsed * (6 * elapsed - 15) + 10);
        const destination = ctaWeights(target);
        weights = {
          hero: from.hero + (destination.hero - from.hero) * eased,
          explore: from.explore + (destination.explore - from.explore) * eased,
          bottom: from.bottom + (destination.bottom - from.bottom) * eased,
          corner: from.corner + (destination.corner - from.corner) * eased,
          cornerLeft: from.cornerLeft + (destination.cornerLeft - from.cornerLeft) * eased,
          menu: from.menu + (destination.menu - from.menu) * eased,
        };
        animating = elapsed < 1;
        if (animating) frame = requestAnimationFrame(update);
      }

      const showFloating = animating || target === 'corner' || target === 'cornerLeft';
      heroButton.style.visibility = !showFloating && target === 'hero' ? '' : 'hidden';
      if (exploreLink) exploreLink.style.visibility = !showFloating && target === 'explore' ? '' : 'hidden';
      if (bottomButton) bottomButton.style.visibility = !showFloating && target === 'bottom' ? '' : 'hidden';
      menuButton.style.visibility = !showFloating && target === 'menu' ? 'visible' : 'hidden';
      floating.style.visibility = showFloating ? 'visible' : 'hidden';
      if (!showFloating) return;

      const cornerX = window.innerWidth - CTA_CORNER_GAP - CTA_ICON_SIZE;
      const cornerY = viewportHeight - CTA_CORNER_GAP - CTA_ICON_SIZE;
      const menuWeight = weights.menu;
      const menuBox = menuButton.getBoundingClientRect();
      let x = cornerX + (CTA_CORNER_GAP - cornerX) * weights.cornerLeft + (menuBox.left - cornerX) * menuWeight;
      let y = cornerY + (menuBox.top - cornerY) * menuWeight;
      let width = CTA_ICON_SIZE + (menuBox.width - CTA_ICON_SIZE) * menuWeight;
      let height = CTA_ICON_SIZE + (menuBox.height - CTA_ICON_SIZE) * menuWeight;
      let labelAnchor: CtaAnchor = 'hero';
      for (const stop of CTA_ANCHOR_STOPS) {
        if (weights[stop] === 0) continue;
        const box = anchors[stop];
        if (!box) continue;
        // Keep the departing shape in view if a fast swipe takes its anchor offscreen.
        const anchorY = stop === target ? box.top : stop === 'hero'
          ? Math.max(box.top, heroStart - box.height)
          : Math.max(0, Math.min(box.top, lowerEdge - box.height));
        x += (box.left - cornerX) * weights[stop];
        y += (anchorY - cornerY) * weights[stop];
        width += (box.width - CTA_ICON_SIZE) * weights[stop];
        height += (box.height - CTA_ICON_SIZE) * weights[stop];
        if (weights[stop] > weights[labelAnchor]) labelAnchor = stop;
      }

      floating.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      floating.style.width = `${width}px`;
      floating.style.height = `${height}px`;
      floating.style.zIndex = target === 'menu' || menuWeight > 0 ? '101' : '90';
      floating.inert = target === 'menu' || menuWeight > 0;
      const lightWeight = weights.hero + weights.explore;
      const iconWeight = weights.corner + weights.cornerLeft;
      const lightSurface = `color-mix(in srgb, var(--mkt-card) ${lightWeight / (lightWeight + iconWeight || 1) * 100}%, transparent)`;
      const pillSurface = `color-mix(in srgb, var(--mkt-cta-gold) ${menuWeight / (1 - weights.bottom || 1) * 100}%, ${lightSurface})`;
      floating.style.background = `color-mix(in srgb, var(--mkt-ink) ${weights.bottom * 100}%, ${pillSurface})`;
      floating.style.borderColor = `color-mix(in srgb, var(--mkt-ink) ${(1 - iconWeight) * 100}%, transparent)`;

      const text = CTA_ANCHORS[labelAnchor].label;
      if (label.textContent !== text) label.textContent = text;
      floating.setAttribute('aria-label', menuOpenRef.current ? MENU_CTA_LABEL : weights[labelAnchor] > 0.5 ? text : 'Create now');
      label.style.opacity = String(weights[labelAnchor]);
      label.style.color = labelAnchor === 'bottom' ? 'var(--mkt-card)' : 'var(--mkt-ink)';
      label.style.fontSize = `${CTA_ANCHORS[labelAnchor].fontSize}px`;
      icon.style.opacity = String(iconWeight);
      menuLabel.style.opacity = String(menuWeight);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    scheduleCta.current = schedule;
    update(performance.now());
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      scheduleCta.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [landing, templates, reduceMotion]);

  const changeMenu = useCallback((open: boolean) => {
    menuOpenRef.current = open;
    setMenuOpen(open);
    scheduleCta.current?.();
  }, []);

  useEffect(() => {
    templateService.getActive().then(setTemplates).catch(() => {});
    landingService.get().then(setLanding).catch(() => {});
  }, []);

  const startFunnel = () => router.push('/personalise/picker');

  // CMS helpers: scalar content with fallback, and repeatable items by section.
  // `||` (not `??`) so a saved-but-empty override still falls back to the live default
  // rather than blanking the heading.
  const c = (key: string) => landing?.content?.[key] || LANDING_CONTENT_DEFAULTS[key] || '';
  const itemsOf = (sectionKey: string, fallback: LandingDefaultItem[]): LandingDefaultItem[] => {
    const rows = (landing?.items ?? []).filter((i) => i.sectionKey === sectionKey && i.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    return rows.length > 0
      ? rows.map((r: LandingItemDto) => ({ title: r.title, body: r.body, meta: r.meta, price: r.price, features: r.features, cta: r.cta, ctaHref: r.ctaHref, highlighted: r.highlighted }))
      : fallback;
  };

  const quotes = itemsOf('stories', DEFAULT_STORY_ITEMS);
  const pricing = itemsOf('pricing', DEFAULT_PRICING_ITEMS);
  const featuredCodes = c('explore.templates');
  const featuredTemplates = featuredCodes === 'auto' ? templates.slice(0, 3) : featuredCodes.split(',').map((code) => templates.find((t) => t.templateCode === code)).filter((t): t is Template => !!t);

  // Middle-section order + visibility from CMS (hero/footer are always shown).
  const middleOrder = useMemo(() => {
    const secs = (landing?.sections ?? []).filter((s) => DEFAULT_MIDDLE.includes(s.sectionKey));
    if (secs.length === 0) return DEFAULT_MIDDLE;
    const ordered = [...secs].sort((a, b) => a.sortOrder - b.sortOrder).filter((s) => s.isVisible).map((s) => s.sectionKey);
    // include any default section the CMS didn't record, at the end
    return [...ordered, ...DEFAULT_MIDDLE.filter((k) => !secs.some((s) => s.sectionKey === k))];
  }, [landing]);

  const menuLinks = readLandingMenu(landing?.content?.[LANDING_MENU_KEY])
    .filter(({ section }) => section === 'top' || section === 'footer' ||
      (section === 'explore-designs' ? middleOrder.includes('features') && featuredTemplates.length > 0 : middleOrder.includes(section)))
    .map((link) => ({ ...link, label: link.label.trim() || LANDING_MENU_SECTIONS.find(({ value }) => value === link.section)?.label || link.section }));

  const renderMiddle = (key: string) => {
    switch (key) {
      case 'features':
        return (
          <div key="features">
          <InviteSteps copy={c} padding={SECTION_PAD} />
          {featuredTemplates.length > 0 && (
            <section id="explore-designs" style={{ padding: SECTION_PAD, paddingBottom: EXPLORE_BOTTOM_PAD }}>
              <div style={{ maxWidth: 1040, margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 'clamp(34px, 5vw, 44px)', lineHeight: 1.1, margin: 0 }}>{c('explore.title')}</h2>
                <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 16, color: 'var(--mkt-muted)', marginTop: 8 }}>{c('explore.subtitle')}</p>
                <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 220px))', justifyContent: 'center', gap: '28px clamp(20px, 4vw, 48px)' }}>
                  {featuredTemplates.map((template) => (
                    <Link key={template.templateId} href={`/personalise?template=${template.templateId}&event=${parseEventTypes(template.eventTypes)[0]}`} style={{ color: 'var(--mkt-ink)', textDecoration: 'none' }} aria-label={`Personalise ${template.templateName}`}>
                      <div style={{ border: '2px solid var(--mkt-ink)', borderRadius: 25, overflow: 'hidden', boxShadow: '0 6px 0 rgba(23,19,13,.12)' }}><TemplatePreview templateCode={template.templateCode} thumbnailUrl={template.thumbnailUrl} aspect="390 / 700" /></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
                        <div><strong style={{ fontFamily: 'var(--mkt-serif)', fontSize: 20 }}>{template.templateName}</strong><div style={{ fontFamily: 'var(--mkt-sans)', fontSize: 12, color: 'var(--mkt-muted)', marginTop: 3 }}>{template.tier}</div></div>
                        <span aria-hidden="true" style={{ border: '1px solid currentColor', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center' }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 36 }}><Link ref={exploreCtaRef} href="/personalise/picker" className="mkt-btn" style={{ display: 'inline-block', padding: '14px 32px', fontSize: 17, color: 'var(--mkt-ink)', textDecoration: 'none' }}>View all designs</Link></div>
              </div>
            </section>
          )}
          </div>
        );
      case 'pricing': {
        const followsExplore = featuredTemplates.length > 0 && middleOrder[middleOrder.indexOf(key) - 1] === 'features';
        return (
          <section key="pricing" id="pricing" style={{ padding: SECTION_PAD, paddingTop: followsExplore ? EXPLORE_BOTTOM_PAD : undefined }}>
            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 'clamp(34px, 5vw, 44px)', lineHeight: 1, margin: 0 }}>{c('pricing.title')}</h2>
              <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 16, color: 'var(--mkt-muted)', marginTop: 8 }}>{c('pricing.subtitle')}</p>
              <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                {pricing.map((plan, i) => {
                  const planFeatures = (plan.features ?? '').split('\n').map((f) => f.trim()).filter(Boolean);
                  return (
                    <motion.div key={plan.title ?? i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09, duration: 0.45 }} style={{ position: 'relative', background: plan.highlighted ? '#faedcf' : 'var(--mkt-card)', border: '2.5px solid var(--mkt-ink)', borderRadius: 22, padding: 22, boxShadow: '0 7px 0 rgba(23,19,13,.12)' }}>
                      {plan.highlighted && <div style={{ position: 'absolute', top: -13, right: 18, fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 12, letterSpacing: '.06em', background: 'var(--mkt-gold)', color: 'var(--mkt-ink)', border: '2px solid var(--mkt-ink)', borderRadius: 999, padding: '4px 12px' }}>POPULAR</div>}
                      <div style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 20 }}>{plan.title}</div>
                      <div style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 34, marginTop: 2 }}>{plan.price}</div>
                      <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>{plan.body}</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {planFeatures.map((f) => (
                          <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-ink)' }}><span style={{ color: 'var(--mkt-gold-ink)', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}</li>
                        ))}
                      </ul>
                      <a href={plan.ctaHref || '/login'} className={plan.highlighted ? 'mkt-btn mkt-btn-dark' : 'mkt-btn'} style={{ display: 'block', textAlign: 'center', marginTop: 18, fontSize: 15, padding: '12px', boxShadow: plan.highlighted ? '0 5px 0 rgba(23,19,13,.18)' : '0 5px 0 rgba(23,19,13,.14)' }}>{plan.cta}</a>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }
      case 'stories':
        return (
          <section key="stories" id="stories" style={{ padding: SECTION_PAD, background: 'var(--mkt-card)', borderTop: '2px solid var(--mkt-ink)', borderBottom: '2px solid var(--mkt-ink)' }}>
            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 'clamp(34px, 5vw, 44px)', lineHeight: 1, margin: 0 }}>{c('stories.title')}</h2>
              <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 16, color: 'var(--mkt-muted)', marginTop: 8 }}>{c('stories.subtitle')}</p>
              {templates.length > 0 && (
                <div style={{ marginTop: 22, display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 6 }}>
                  {templates.slice(0, 6).map((t) => (
                    <div key={t.templateId} style={{ flex: 'none', width: 150, borderRadius: 18, overflow: 'hidden', border: '3px solid var(--mkt-ink)', boxShadow: '0 10px 22px rgba(23,19,13,.18)' }}>
                      <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} aspect="390 / 700" />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {quotes.map((q, i) => (
                  <div key={i} className="mkt-card" style={{ padding: 20 }}>
                    <div style={{ fontFamily: 'var(--mkt-serif)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.5, color: '#2a231a' }}>“{q.body}”</div>
                    <div style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 500, fontSize: 14, color: 'var(--mkt-gold)', marginTop: 10 }}>{q.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'about':
        return (
          <section key="about" id="about" style={{ padding: SECTION_PAD }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 'clamp(34px, 5vw, 44px)', lineHeight: 1, margin: 0 }}>{c('about.title')}</h2>
              <p style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 600, fontSize: 'clamp(22px, 3.4vw, 30px)', lineHeight: 1.2, marginTop: 22 }}>
                {c('about.heading')}
              </p>
              <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 16, color: 'var(--mkt-muted-2)', lineHeight: 1.6, marginTop: 18 }}>
                {c('about.body')}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                <div className="mkt-card" style={{ flex: '1 1 160px', padding: 16, textAlign: 'center', boxShadow: 'none' }}>
                  <div style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 32 }}>{c('about.stat1.value')}</div>
                  <div style={{ fontFamily: 'var(--mkt-sans)', fontSize: 13, color: 'var(--mkt-muted)' }}>{c('about.stat1.label')}</div>
                </div>
                <div className="mkt-card" style={{ flex: '1 1 160px', padding: 16, textAlign: 'center', boxShadow: 'none' }}>
                  <div style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 32 }}>{c('about.stat2.value')}</div>
                  <div style={{ fontFamily: 'var(--mkt-sans)', fontSize: 13, color: 'var(--mkt-muted)' }}>{c('about.stat2.label')}</div>
                </div>
              </div>
              <button ref={bottomCtaRef} className="mkt-btn mkt-btn-dark" onClick={startFunnel} style={{ width: '100%', height: 60, marginTop: 26, fontSize: 19 }}>
                Make your first invite
              </button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mkt [--mkt-cta-gold:#e3ac4d]" id="top" style={{ minHeight: '100vh' }}>
      <MarketingNav links={menuLinks} open={menuOpen} onOpenChange={changeMenu} ctaRef={menuCtaRef} ctaLabel={MENU_CTA_LABEL} onCtaClick={startFunnel} />

      {/* ── Hero (always shown) ──────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 6vw, 72px) 0 clamp(48px, 7vw, 80px)', textAlign: 'center', animation: 'mkt-fadeIn .5s ease both' }}>
        <div style={{ padding: '0 clamp(20px, 5vw, 72px)' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Wordmark size={76} stacked byline />
          </div>
          <p style={{ fontFamily: 'var(--mkt-serif)', fontSize: 'clamp(16px, 2.4vw, 22px)', marginTop: 18, color: '#2a231a' }}>
            {c('hero.tagline')}
          </p>
          <h1 style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 400, fontSize: 'clamp(21px, 3vw, 28px)', lineHeight: 1.25, margin: '20px 0 0' }}>{c('hero.heading')}</h1>
          <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.5, margin: '6px auto 0', maxWidth: 650, color: 'var(--mkt-muted-2)' }}>{c('hero.body')}</p>
        </div>
        <div style={{ marginTop: 'clamp(32px, 5vw, 56px)' }}>
          {templates.length > 0 && <TemplateMarquee templates={templates} />}
        </div>
        <button ref={heroCtaRef} className="mkt-btn" onClick={startFunnel} style={{ marginTop: 'clamp(28px, 4vw, 44px)', width: 212, height: 68, fontSize: 21 }}>
          Create Now
        </button>
      </section>

      {middleOrder.map(renderMiddle)}
      <button
        ref={floatingCtaRef}
        className="mkt-btn"
        onClick={startFunnel}
        aria-label="Create now"
        style={{
          position: 'fixed', left: 0, top: 0, zIndex: 90, padding: 0,
          width: CTA_ICON_SIZE, height: CTA_ICON_SIZE, visibility: 'hidden',
          display: 'grid', gridTemplate: 'minmax(0, 1fr) / minmax(0, 1fr)', placeItems: 'center',
          overflow: 'hidden', transition: 'none', background: 'transparent', boxShadow: 'none',
        }}
      >
        <span ref={ctaIconRef} aria-hidden="true" style={{ gridArea: '1 / 1', position: 'relative', width: CTA_ICON_SIZE, height: CTA_ICON_SIZE, display: 'grid', placeItems: 'center', fontSize: 32, lineHeight: 1, pointerEvents: 'none' }}>
          <motion.svg
            viewBox={`0 0 ${CTA_ICON_SIZE} ${CTA_ICON_SIZE}`}
            animate={{ rotate: reduceMotion ? 0 : -360 }}
            transition={reduceMotion ? { duration: 0 } : { duration: CTA_RING_ROTATION_SECONDS, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transformOrigin: '50% 50%' }}
          >
            <defs>
              <path id={ctaTextPathId} d={CTA_RING_PATH} />
            </defs>
            <text fill="currentColor" fontSize={CTA_RING_FONT_SIZE} fontWeight="600" textAnchor="middle">
              <textPath href={`#${ctaTextPathId}`} startOffset="50%" textLength={CTA_RING_TEXT_LENGTH} lengthAdjust="spacing">
                {CTA_RING_TEXT}
              </textPath>
            </text>
          </motion.svg>
          <span style={{ width: CTA_DISC_SIZE, height: CTA_DISC_SIZE, borderRadius: '50%', background: 'var(--mkt-cta-gold)', display: 'grid', placeItems: 'center' }}>
            <motion.span
              animate={{ rotate: reduceMotion ? 0 : 360 }}
              transition={reduceMotion ? { duration: 0 } : { duration: CTA_STAR_ROTATION_SECONDS, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'block' }}
            >
              ✦
            </motion.span>
          </span>
        </span>
        <span ref={ctaLabelRef} aria-hidden="true" style={{ gridArea: '1 / 1', whiteSpace: 'nowrap', opacity: 0 }} />
        <span ref={menuCtaLabelRef} aria-hidden="true" style={{ gridArea: '1 / 1', whiteSpace: 'nowrap', opacity: 0, fontSize: 19 }}>
          {MENU_CTA_LABEL}
        </span>
      </button>

      {/* ── Footer (always shown) ────────────────────────────────────────── */}
      <footer id="footer" style={{ background: 'var(--mkt-ink)', padding: 'clamp(28px, 4vw, 44px) clamp(20px, 5vw, 72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span className="mkt-wordmark" style={{ fontSize: 22, color: 'var(--mkt-card)' }}>
          <span>The Invit</span><span className="u">_</span><span className="e">e</span>
        </span>
        <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'rgba(251,247,239,0.5)', margin: 0 }}>{c('footer.tagline')}</p>
        <Link href="/login" style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'rgba(251,247,239,0.7)' }}>Sign in →</Link>
      </footer>
    </div>
  );
}
