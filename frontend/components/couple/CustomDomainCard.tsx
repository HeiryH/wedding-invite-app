'use client';

import { useState } from 'react';
import { weddingService } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';

interface CustomDomainCardProps {
  weddingId: number;
  domain?: string | null;
  /** PRO tier unlocks custom domains. */
  isPro: boolean;
}

const cardStyle: React.CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border, rgba(0,0,0,.08))',
  background: 'var(--surface, #fff)',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const titleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const title: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-strong, #1a1a1a)' };
const desc: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', lineHeight: 1.5, color: 'var(--text-soft, #667)' };
const proTag: React.CSSProperties = { marginLeft: 'auto', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 800, letterSpacing: '.06em', color: 'var(--gold-700)', background: 'color-mix(in srgb, var(--gold-400) 16%, transparent)', border: '1px solid var(--gold-200)', borderRadius: 'var(--radius-full)', padding: '2px 8px' };

export function CustomDomainCard({ weddingId, domain, isPro }: CustomDomainCardProps) {
  const [current, setCurrent] = useState<string | null>(domain ?? null);
  const [value, setValue] = useState(domain ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (next: string) => {
    setSaving(true);
    setMsg(null);
    try {
      const w = await weddingService.setDomain(weddingId, next.trim());
      setCurrent(w.domain ?? null);
      setValue(w.domain ?? '');
      setMsg({ ok: true, text: w.domain ? 'Domain saved.' : 'Domain removed.' });
    } catch (e) {
      const apiMessage = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg({ ok: false, text: apiMessage || 'Could not save the domain.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Locked (non-PRO) ─────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div style={cardStyle}>
        <div style={titleRow}>
          <Icon name="link" size={15} style={{ color: 'var(--gold-600)' }} />
          <p style={title}>Custom domain</p>
          <span style={proTag}>PRO</span>
        </div>
        <p style={desc}>
          Serve your invitation on your own web address, e.g.{' '}
          <strong>john-and-mary.com</strong>, instead of the platform link.
        </p>
        <a
          href="/templates"
          style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--gold-700)', textDecoration: 'none', border: '1px solid var(--gold-400)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
        >
          Upgrade to PRO
        </a>
      </div>
    );
  }

  // ── PRO: editable ────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = { flex: 1, minWidth: 0, padding: '9px 12px', fontFamily: 'var(--font-ui)', fontSize: 13, border: '1px solid var(--border, rgba(0,0,0,.14))', borderRadius: 'var(--radius-md)', background: 'var(--surface, #fff)', color: 'var(--text-strong, #1a1a1a)' };

  return (
    <div style={cardStyle}>
      <div style={titleRow}>
        <Icon name="link" size={15} style={{ color: 'var(--brand)' }} />
        <p style={title}>Custom domain</p>
        <span style={proTag}>PRO</span>
      </div>
      <p style={desc}>Point your own domain at your invitation. Enter it below, then create the DNS record shown after saving.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="john-and-mary.com"
          spellCheck={false}
          autoCapitalize="none"
          style={inputStyle}
          onKeyDown={(e) => { if (e.key === 'Enter' && !saving) submit(value); }}
        />
        <button
          onClick={() => submit(value)}
          disabled={saving || value.trim() === (current ?? '')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving || value.trim() === (current ?? '') ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {msg && (
        <p style={{ ...desc, color: msg.ok ? 'var(--green-700, #15803d)' : 'var(--red-600, #dc2626)', fontWeight: 600 }}>
          {msg.text}
        </p>
      )}

      {current && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px dashed var(--border, rgba(0,0,0,.1))', paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Icon name="check" size={13} style={{ color: 'var(--green-700, #15803d)' }} />
            <a href={`https://${current}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
              https://{current} <Icon name="external-link" size={11} />
            </a>
            <button
              onClick={() => submit('')}
              disabled={saving}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--red-600, #dc2626)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Remove
            </button>
          </div>
          <p style={{ ...desc, fontSize: 11 }}>
            Not live yet? At your domain registrar, create an <strong>A record</strong> pointing{' '}
            <code>{current}</code> to the server, then reload the page after DNS propagates.
          </p>
        </div>
      )}
    </div>
  );
}
