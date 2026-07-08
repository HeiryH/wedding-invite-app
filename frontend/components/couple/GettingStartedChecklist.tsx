'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface Props {
  coupleName: string;
  detailsComplete: boolean;
  guestCount: number;
  isPublic: boolean;
  onEditDetails: () => void;
  onAddGuests: () => void;
}

const DISMISS_KEY = 'onboarding.dismissed';
const CUSTOMIZED_KEY = 'onboarding.customized';
const PREVIEWED_KEY = 'onboarding.previewed';

export function GettingStartedChecklist({
  coupleName, detailsComplete, guestCount, isPublic, onEditDetails, onAddGuests,
}: Props) {
  // localStorage-backed flags for the two "explore" steps (no server signal for them).
  const [customized, setCustomized] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until we read storage

  useEffect(() => {
    setCustomized(!!localStorage.getItem(CUSTOMIZED_KEY));
    setPreviewed(!!localStorage.getItem(PREVIEWED_KEY));
    setDismissed(!!localStorage.getItem(DISMISS_KEY));
  }, []);

  const steps = [
    { label: 'Add your names, date & venue', done: detailsComplete,
      cta: 'Edit details', onClick: onEditDetails },
    { label: 'Design your invitation', done: customized,
      cta: 'Customize', href: '/couple-admin/customize',
      mark: () => { localStorage.setItem(CUSTOMIZED_KEY, '1'); setCustomized(true); } },
    { label: 'Invite your guests', done: guestCount > 0,
      cta: 'Add guests', onClick: onAddGuests },
    { label: 'Preview & share your invitation', done: previewed,
      cta: 'Preview', href: `/wedding/${coupleName}`, external: true,
      mark: () => { localStorage.setItem(PREVIEWED_KEY, '1'); setPreviewed(true); } },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (dismissed) return null;

  const dismiss = () => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true); };

  return (
    <section
      aria-label="Getting started checklist"
      style={{
        background: 'var(--surface-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg, 16px)', padding: '20px 22px', marginBottom: 24,
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
            {allDone ? "You're all set! 🎉" : 'Getting started'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>
            {allDone
              ? isPublic
                ? 'Your invitation is live. Nicely done!'
                : 'Everything looks ready — reach out to us when you want to go live.'
              : `${doneCount} of ${steps.length} steps complete`}
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss getting started checklist"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 6px', borderRadius: 6, fontSize: 20, lineHeight: 1 }}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      {/* progress bar */}
      <div aria-hidden="true" style={{ height: 6, borderRadius: 999, background: 'var(--surface-sunken)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ width: `${(doneCount / steps.length) * 100}%`, height: '100%', background: 'var(--brand)', transition: 'width var(--dur-base, .3s) ease' }} />
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map((step) => (
          <li key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            {step.done ? (
              <Icon name="check-circle" size={20} aria-hidden="true" style={{ color: 'var(--brand)', flexShrink: 0 }} />
            ) : (
              <Icon name="circle-dashed" size={20} aria-hidden="true" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
            <span style={{
              flex: 1, fontSize: 14,
              color: step.done ? 'var(--text-muted)' : 'var(--text-body)',
              textDecoration: step.done ? 'line-through' : 'none',
            }}>
              <span style={srOnly}>{step.done ? 'Completed: ' : 'To do: '}</span>
              {step.label}
            </span>
            {!step.done && (
              step.href ? (
                <a
                  href={step.href}
                  target={step.external ? '_blank' : undefined}
                  rel={step.external ? 'noopener noreferrer' : undefined}
                  onClick={step.mark}
                  style={ctaStyle}
                >
                  {step.cta}
                </a>
              ) : (
                <button onClick={step.onClick} style={{ ...ctaStyle, border: 'none', cursor: 'pointer' }}>
                  {step.cta}
                </button>
              )
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

const ctaStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: '5px 12px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--brand)',
  background: 'var(--brand-subtle)',
  borderRadius: 'var(--radius-sm, 8px)',
  textDecoration: 'none',
  fontFamily: 'var(--font-ui)',
};
