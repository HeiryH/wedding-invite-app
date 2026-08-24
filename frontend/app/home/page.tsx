'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { templateService, Template, landingService, LandingDto, LandingItemDto } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { TemplateMarquee } from '@/components/marketing/TemplateMarquee';
import { Wordmark } from '@/components/marketing/Wordmark';
import { LANDING_CONTENT_DEFAULTS, DEFAULT_FEATURE_ITEMS, DEFAULT_STORY_ITEMS, DEFAULT_PRICING_ITEMS, DEFAULT_MIDDLE_SECTIONS, LandingDefaultItem } from '@/lib/landing/defaults';

const SECTION_PAD = 'clamp(56px, 8vw, 96px) clamp(20px, 5vw, 72px)';
const DEFAULT_MIDDLE = DEFAULT_MIDDLE_SECTIONS;

export default function HomePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [landing, setLanding] = useState<LandingDto | null>(null);
  const router = useRouter();

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

  const features = itemsOf('features', DEFAULT_FEATURE_ITEMS);
  const quotes = itemsOf('stories', DEFAULT_STORY_ITEMS);
  const pricing = itemsOf('pricing', DEFAULT_PRICING_ITEMS);

  // Middle-section order + visibility from CMS (hero/footer are always shown).
  const middleOrder = useMemo(() => {
    const secs = (landing?.sections ?? []).filter((s) => DEFAULT_MIDDLE.includes(s.sectionKey));
    if (secs.length === 0) return DEFAULT_MIDDLE;
    const ordered = [...secs].sort((a, b) => a.sortOrder - b.sortOrder).filter((s) => s.isVisible).map((s) => s.sectionKey);
    // include any default section the CMS didn't record, at the end
    return [...ordered, ...DEFAULT_MIDDLE.filter((k) => !secs.some((s) => s.sectionKey === k))];
  }, [landing]);

  const renderMiddle = (key: string) => {
    switch (key) {
      case 'features':
        return (
          <section key="features" id="features" style={{ padding: SECTION_PAD, background: 'var(--mkt-card)', borderTop: '2px solid var(--mkt-ink)', borderBottom: '2px solid var(--mkt-ink)' }}>
            <div style={{ maxWidth: 940, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--mkt-serif)', fontWeight: 700, fontSize: 'clamp(34px, 5vw, 44px)', lineHeight: 1, margin: 0 }}>{c('features.title')}</h2>
              <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 16, color: 'var(--mkt-muted)', marginTop: 8 }}>{c('features.subtitle')}</p>
              <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {features.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45 }} className="mkt-card" style={{ display: 'flex', gap: 15, alignItems: 'flex-start', padding: 18 }}>
                    <div style={{ flex: 'none', width: 44, height: 44, borderRadius: 12, border: '2px solid var(--mkt-ink)', background: f.meta || '#8fd8f2' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--mkt-sans)', fontWeight: 600, fontSize: 18 }}>{f.title}</div>
                      <div style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'var(--mkt-muted-2)', marginTop: 3, lineHeight: 1.45 }}>{f.body}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'pricing':
        return (
          <section key="pricing" id="pricing" style={{ padding: SECTION_PAD }}>
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
              <button onClick={startFunnel} className="mkt-btn mkt-btn-dark" style={{ width: '100%', marginTop: 26, fontSize: 19, padding: 15 }}>Make your first invite</button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mkt" id="top" style={{ minHeight: '100vh' }}>
      <MarketingNav />

      {/* ── Hero (always shown) ──────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 6vw, 72px) 0 clamp(48px, 7vw, 80px)', textAlign: 'center', animation: 'mkt-fadeIn .5s ease both' }}>
        <div style={{ padding: '0 clamp(20px, 5vw, 72px)' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Wordmark size={76} stacked byline />
          </div>
          <p style={{ fontFamily: 'var(--mkt-serif)', fontSize: 'clamp(16px, 2.4vw, 22px)', marginTop: 18, color: '#2a231a' }}>
            {c('hero.tagline')}
          </p>
        </div>
        <div style={{ marginTop: 'clamp(32px, 5vw, 56px)' }}>
          {templates.length > 0 && <TemplateMarquee templates={templates} />}
        </div>
        <div style={{ marginTop: 'clamp(28px, 4vw, 44px)' }}>
          <button onClick={startFunnel} className="mkt-btn" style={{ fontSize: 21, padding: '16px 46px' }}>Try For Free</button>
        </div>
      </section>

      {middleOrder.map(renderMiddle)}

      {/* ── Footer (always shown) ────────────────────────────────────────── */}
      <footer style={{ background: 'var(--mkt-ink)', padding: 'clamp(28px, 4vw, 44px) clamp(20px, 5vw, 72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span className="mkt-wordmark" style={{ fontSize: 22, color: 'var(--mkt-card)' }}>
          <span>The Invit</span><span className="u">_</span><span className="e">e</span>
        </span>
        <p style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'rgba(251,247,239,0.5)', margin: 0 }}>{c('footer.tagline')}</p>
        <a href="/login" style={{ fontFamily: 'var(--mkt-sans)', fontSize: 14, color: 'rgba(251,247,239,0.7)' }}>Sign in →</a>
      </footer>
    </div>
  );
}
