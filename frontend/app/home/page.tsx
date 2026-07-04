'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { templateService, Template } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { tierLabel } from '@/lib/tierRank';

const tierBadge: Record<string, { bg: string; color: string }> = {
  FREE:    { bg: 'rgba(255,255,255,0.18)', color: '#fff' },
  PREMIUM: { bg: 'rgba(202,165,82,0.25)',  color: '#f5d98a' },
  PRO:     { bg: 'rgba(99,174,215,0.22)',  color: '#a8d8f0' },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick your template',
    body: 'Browse our curated collection of invitation designs — from timeless classics to modern elegance.',
    icon: '🎨',
  },
  {
    step: '02',
    title: 'Customize everything',
    body: "Add your names, wedding date, venue, photos, and personal message. What you see is what your guests get.",
    icon: '✏️',
  },
  {
    step: '03',
    title: 'Share with guests',
    body: 'Send a beautiful link to your guests. Collect RSVPs, wishes, and memories all in one place.',
    icon: '💌',
  },
];

const PRICING = [
  {
    tier: 'Free',
    price: 'Free forever',
    highlight: false,
    description: 'Try the editor and see how it feels before committing.',
    features: [
      '1 free invitation template',
      'Full editor access',
      'Private preview (self-test only)',
      'Test RSVPs & wishes',
    ],
    cta: 'Get started free',
    ctaHref: '/try',
  },
  {
    tier: 'Premium',
    price: 'Contact us',
    highlight: true,
    description: 'Share your invitation with real guests and unlock premium designs.',
    features: [
      'All free features',
      'Shareable public link',
      'All premium templates',
      'RSVP management',
      'Wishes & guestbook',
    ],
    cta: 'Contact us to upgrade',
    ctaHref: '/login',
  },
  {
    tier: 'Pro',
    price: 'Contact us',
    highlight: false,
    description: 'The full experience for couples who want everything.',
    features: [
      'All premium features',
      'All Pro templates',
      'Photo booth',
      'Seating arrangement',
      'Priority support',
    ],
    cta: 'Contact us to upgrade',
    ctaHref: '/login',
  },
];

export default function HomePage() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    templateService.getActive().then(setTemplates).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--sand-0)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '0 clamp(20px, 5vw, 80px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/home" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, color: 'var(--em)', letterSpacing: '-0.5px' }}>Convive</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/try" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--em-on)', background: 'var(--em)', padding: '7px 16px', borderRadius: 'var(--radius-full)', textDecoration: 'none', letterSpacing: '0.01em' }}>
            Try for free
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--em-gradient)', padding: 'clamp(72px, 12vw, 140px) clamp(20px, 5vw, 80px) clamp(64px, 10vw, 120px)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
            Digital Wedding Invitations
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(40px, 7vw, 88px)', fontWeight: 400, color: '#fff', lineHeight: 1.06, letterSpacing: '-0.02em', margin: '0 auto 24px', maxWidth: 800 }}>
            Invitations as beautiful as your wedding day
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.82)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Create stunning digital invitations in minutes. Collect RSVPs, share memories, and celebrate your love story.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/try" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, color: 'var(--em-800)', background: '#fff', padding: '14px 28px', borderRadius: 'var(--radius-full)', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', letterSpacing: '0.01em' }}>
              Start for free →
            </a>
            <a href="#templates" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 16, color: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.4)', padding: '14px 28px', borderRadius: 'var(--radius-full)', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
              Browse templates
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: 'var(--sand-25)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 12 }}>How it works</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: 'var(--text-strong)', textAlign: 'center', letterSpacing: '-0.01em', margin: '0 0 56px' }}>
            Ready in three steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                style={{ background: 'var(--sand-0)', borderRadius: 'var(--radius-xl)', padding: '32px 28px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--em)', marginBottom: 8 }}>
                  Step {item.step}
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: 'var(--text-strong)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>{item.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Template showcase ─────────────────────────────────────────────── */}
      {templates.length > 0 && (
        <section id="templates" style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: 'var(--sand-0)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 12 }}>Templates</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: 'var(--text-strong)', textAlign: 'center', letterSpacing: '-0.01em', margin: '0 0 16px' }}>
              Choose your style
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-base)', margin: '0 0 52px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
              From timeless classics to modern elegance. Free templates to get started, Premium and Pro to stand out.
            </p>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6" style={{ columnGap: 24 }}>
              {templates.map((t, i) => {
                const tb = tierBadge[t.tier?.toUpperCase() ?? 'FREE'] ?? tierBadge.FREE;
                return (
                  <motion.div
                    key={t.templateId}
                    className="break-inside-avoid"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.45 }}
                    style={{ marginBottom: 24, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}
                  >
                    <TemplatePreview templateCode={t.templateCode} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: tb.bg, color: tb.color, backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {tierLabel[t.tier?.toUpperCase() ?? 'FREE'] ?? t.tier}
                      </span>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'var(--sand-0)' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, fontWeight: 400, color: 'var(--text-strong)', margin: 0, letterSpacing: '-0.01em' }}>{t.templateName}</p>
                      {t.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.4 }}>{t.description}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href="/try" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--em)', textDecoration: 'none', padding: '10px 20px', border: '1.5px solid var(--em-border)', borderRadius: 'var(--radius-full)' }}>
                Try the editor free →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)', background: 'var(--sand-25)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 12 }}>Pricing</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: 'var(--text-strong)', textAlign: 'center', letterSpacing: '-0.01em', margin: '0 0 56px' }}>
            Simple, honest pricing
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px 28px',
                  border: `2px solid ${plan.highlight ? 'var(--em)' : 'var(--border-subtle)'}`,
                  background: plan.highlight ? 'var(--em-subtle)' : 'var(--sand-0)',
                  boxShadow: plan.highlight ? '0 4px 24px rgba(5,150,105,0.12)' : 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--em)', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)', padding: '4px 14px', borderRadius: 'var(--radius-full)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Most popular
                  </div>
                )}
                <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-strong)', margin: '0 0 4px' }}>{plan.tier}</h3>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, color: plan.highlight ? 'var(--em)' : 'var(--text-strong)', fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.01em' }}>{plan.price}</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>{plan.description}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                      <span style={{ color: 'var(--em)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  style={{
                    display: 'block', textAlign: 'center', fontFamily: 'var(--font-ui)',
                    fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none',
                    padding: '11px 20px', borderRadius: 'var(--radius-full)',
                    color: plan.highlight ? '#fff' : 'var(--em)',
                    background: plan.highlight ? 'var(--em)' : 'transparent',
                    border: `1.5px solid ${plan.highlight ? 'var(--em)' : 'var(--em-border)'}`,
                  }}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--em-gradient)', padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 400, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 20px', lineHeight: 1.1 }}>
            Ready to create your invitation?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(16px, 2vw, 20px)', margin: '0 0 36px' }}>
            It takes just a few minutes. No credit card required.
          </p>
          <a href="/try" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, color: 'var(--emerald-800)', background: '#fff', padding: '14px 32px', borderRadius: 'var(--radius-full)', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
            Get started for free →
          </a>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--espresso)', padding: 'clamp(32px, 4vw, 48px) clamp(20px, 5vw, 80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--emerald-400)' }}>Convive</span>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Made with love for unforgettable celebrations
        </p>
        <a href="/login" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          Sign in →
        </a>
      </footer>
    </div>
  );
}
