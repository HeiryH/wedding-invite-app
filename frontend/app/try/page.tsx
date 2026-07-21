'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { templateService, Template, authService } from '@/lib/api';
import { TemplateLibrary } from '@/components/templates/TemplateLibrary';
import { Wordmark } from '@/components/marketing/Wordmark';
import { getUser } from '@/lib/auth';

// ── Minimal field/input primitives ────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 5px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>
      {children}
    </p>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', background: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box', transition: 'var(--transition-control)' }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--em)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--em-subtle)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}

// ── Sign-up modal ─────────────────────────────────────────────────────────────

function SignUpModal({ open, onClose, onSubmit, loading, error }: {
  open: boolean; onClose: () => void;
  onSubmit: (email: string, password: string) => void;
  loading: boolean; error: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localErr, setLocalErr] = useState('');

  const submit = () => {
    setLocalErr('');
    if (!email.trim() || !password) { setLocalErr('Email and password are required.'); return; }
    if (password.length < 6) { setLocalErr('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setLocalErr('Passwords do not match.'); return; }
    onSubmit(email.trim().toLowerCase(), password);
  };

  if (!open) return null;

  const displayErr = localErr || error;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-overlay)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-xl)', margin: '0 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', background: 'var(--em-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>💌</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-strong)', fontWeight: 700 }}>
            Save your invitation
          </h2>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Create a free account to save your design and share it with guests.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>Email address</Label>
            <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          </div>
          <div>
            <Label>Password</Label>
            <Input value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input value={confirm} onChange={setConfirm} placeholder="Repeat password" type="password" />
          </div>
        </div>

        {displayErr && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
            {displayErr}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={submit}
            disabled={loading}
            style={{ width: '100%', padding: '12px', border: 'none', borderRadius: 'var(--radius-lg)', background: loading ? 'var(--em-subtle)' : 'var(--em)', color: loading ? 'var(--em)' : '#fff', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'background 0.15s' }}
          >
            {loading ? 'Creating account…' : 'Create free account'}
          </button>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}
          >
            Keep editing
          </button>
        </div>

        <p style={{ margin: '16px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', textAlign: 'center', lineHeight: 1.5 }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--em)', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

function TryEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number>(1);
  const [brideName, setBrideName] = useState('Aisyah');
  const [groomName, setGroomName] = useState('Hariz');
  const [weddingDate, setWeddingDate] = useState('');
  const [venue, setVenue] = useState('Grand Ballroom, Kuala Lumpur');
  const [venueAddress, setVenueAddress] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [previewReady, setPreviewReady] = useState(false);

  // Set default date to 6 months from now
  useEffect(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setWeddingDate(d.toISOString().slice(0, 10));
  }, []);

  // Load active templates
  useEffect(() => {
    templateService.getActive().then((ts) => {
      setTemplates(ts);
      // Honour ?template= param
      const param = searchParams.get('template');
      if (param) {
        const found = ts.find((t) => t.templateId === Number(param));
        if (found) setTemplateId(found.templateId);
      } else if (ts.length > 0) {
        setTemplateId(ts[0].templateId);
      }
    }).catch(console.error);
  }, [searchParams]);

  // If already logged in, send to couple-admin
  useEffect(() => {
    const user = getUser();
    if (user) router.replace('/couple-admin');
  }, [router]);

  // Listen for preview ready
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'PREVIEW_READY') setPreviewReady(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Build and push preview payload whenever form changes
  const pushPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const payload = {
      wedding: {
        weddingId: 0,
        coupleName: `${brideName.toLowerCase().trim().replace(/\s+/g, '-')}-and-${groomName.toLowerCase().trim().replace(/\s+/g, '-')}`,
        brideName: brideName || 'Bride',
        groomName: groomName || 'Groom',
        weddingDate: weddingDate ? `${weddingDate}T10:00:00Z` : new Date(Date.now() + 6 * 30 * 864e5).toISOString(),
        venue: venue || 'Venue TBD',
        venueAddress: venueAddress || '',
        totalGuests: 0,
        totalAttending: 0,
        daysUntilWedding: 180,
        isActive: true,
        totalPhotos: 0,
        enabledFeaturesCount: 0,
        templateId,
        templateName: templates.find((t) => t.templateId === templateId)?.templateName ?? '',
        isRsvpOpen: false,
      },
      coupleMedia: [],
      wishes: [
        { wishId: 1, weddingId: 0, guestName: 'Sarah', message: 'Wishing you a lifetime of joy! 🌸', createdDate: new Date().toISOString() },
        { wishId: 2, weddingId: 0, guestName: 'James', message: 'Congratulations to the beautiful couple!', createdDate: new Date().toISOString() },
      ],
      photoBoothEnabled: false,
      customConfig: {},
      itinerary: [],
    };

    localStorage.setItem('preview_draft', JSON.stringify(payload));
    iframe.contentWindow.postMessage({ type: 'PREVIEW_UPDATE', payload }, window.location.origin);
  }, [brideName, groomName, weddingDate, venue, venueAddress, templateId, templates]);

  useEffect(() => {
    if (previewReady) pushPreview();
  }, [previewReady, pushPreview]);

  const handleIframeLoad = () => {
    // Re-send after iframe navigates (e.g. template switch)
    setTimeout(pushPreview, 300);
  };

  const handleRegister = async (email: string, password: string) => {
    setSaveError('');
    setSaving(true);
    try {
      const res = await authService.selfRegister({
        email, password, brideName, groomName,
        weddingDate: weddingDate ? `${weddingDate}T10:00:00Z` : '',
        venue, venueAddress, templateId,
      });

      // Persist identity to localStorage (mirrors login/page.tsx)
      localStorage.setItem('user', JSON.stringify({
        email: res.email,
        role: res.role,
        weddingId: res.weddingId,
        tier: res.tier,
      }));

      router.push('/couple-admin');
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.templateId === templateId);

  return (
    <>
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--surface-app)' }}>
        {/* ── Left rail ─────────────────────────────────────────────────────── */}
        <aside style={{
          width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border-subtle)', background: 'var(--surface-card)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <Wordmark size={18} />
            </a>
            <a href="/login" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textDecoration: 'none' }}>Sign in</a>
          </div>

          {/* Scrollable form area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Couple names */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                Your details
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <Label>Bride's name</Label>
                  <Input value={brideName} onChange={(v) => { setBrideName(v); }} placeholder="e.g. Aisyah" />
                </div>
                <div>
                  <Label>Groom's name</Label>
                  <Input value={groomName} onChange={(v) => { setGroomName(v); }} placeholder="e.g. Hariz" />
                </div>
                <div>
                  <Label>Wedding date</Label>
                  <Input value={weddingDate} onChange={(v) => { setWeddingDate(v); }} type="date" />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input value={venue} onChange={(v) => { setVenue(v); }} placeholder="e.g. Grand Ballroom" />
                </div>
                <div>
                  <Label>Venue address</Label>
                  <Input value={venueAddress} onChange={(v) => { setVenueAddress(v); }} placeholder="Optional" />
                </div>
              </div>
            </div>

            {/* Update preview button */}
            <button
              onClick={pushPreview}
              style={{ width: '100%', padding: '9px 14px', border: '1px solid var(--em-border)', borderRadius: 'var(--radius-md)', background: 'var(--em-subtle)', color: 'var(--em)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', marginBottom: 24, transition: 'var(--transition-control)' }}
            >
              Update preview
            </button>

            {/* Template picker */}
            {templates.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                  Choose template
                </p>
                <TemplateLibrary
                  templates={templates}
                  userTier="FREE"
                  currentTemplateId={templateId}
                  onSelect={(t) => setTemplateId(t.templateId)}
                  compact
                />
              </div>
            )}
          </div>

          {/* Save CTA (pinned to bottom) */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{ width: '100%', padding: '13px 14px', border: 'none', borderRadius: 'var(--radius-lg)', background: 'var(--em-gradient)', color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(5,150,105,0.3)' }}
            >
              Save your invitation →
            </button>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', textAlign: 'center' }}>
              Free forever · No credit card needed
            </p>
          </div>
        </aside>

        {/* ── Preview panel ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {/* Preview top bar */}
          <div style={{ height: 44, flexShrink: 0, background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fc5f5a' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fdbc40' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c84a' }} />
            </div>
            <div style={{ flex: 1, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-full)', height: 26, display: 'flex', alignItems: 'center', padding: '0 12px', maxWidth: 300, margin: '0 auto' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-muted)' }}>
                {selectedTemplate ? `${selectedTemplate.templateName} · Live Preview` : 'Live Preview'}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-subtle)', marginLeft: 'auto' }}>
              {!previewReady ? 'Loading…' : 'Live'}
            </span>
          </div>

          {/* iframe */}
          <iframe
            ref={iframeRef}
            src="/couple-admin/preview"
            onLoad={handleIframeLoad}
            style={{ flex: 1, border: 'none', width: '100%' }}
            title="Invitation preview"
          />
        </div>
      </div>

      <SignUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleRegister}
        loading={saving}
        error={saveError}
      />
    </>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export default function TryPage() {
  return (
    <Suspense>
      <TryEditor />
    </Suspense>
  );
}
