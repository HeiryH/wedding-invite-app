'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { eventService, templateService, Template } from '@/lib/api';
import Icon from '@/components/admin/Icon';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { EVENT_TYPES, EventTypeKey, matchesEvent, urlSegmentForEventType } from '@/lib/eventTypes';

const first = (name: string) => (name.trim().split(/\s+/)[0] || '').toLowerCase();
const slugifyTitle = (title: string) =>
  title.trim().split(/\s+/).slice(0, 3).join('-').toLowerCase() || 'event';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--line-2)', borderRadius: 10,
  fontSize: 14, color: 'var(--ink)', background: 'white',
  outline: 'none', boxSizing: 'border-box',
};

export default function CreateWeddingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    eventType: 'WEDDING' as EventTypeKey,
    brideName: '',
    groomName: '',
    eventTitle: '',
    weddingDate: '',
    venue: '',
    venueAddress: '',
    templateId: 1,
  });

  useEffect(() => {
    templateService.getActive().then(setTemplates).catch(() => {});
  }, []);

  // Templates are filtered to the chosen event type below — if switching type leaves the current
  // selection invalid, clear it rather than silently submitting a mismatched template.
  useEffect(() => {
    if (templates.length === 0) return;
    const current = templates.find((t) => t.templateId === formData.templateId);
    if (current && matchesEvent(current, formData.eventType)) return;
    const firstMatch = templates.find((t) => matchesEvent(t, formData.eventType));
    setFormData((f) => ({ ...f, templateId: firstMatch?.templateId ?? 0 }));
  }, [formData.eventType, formData.templateId, templates]);

  const visibleTemplates = templates.filter((t) => matchesEvent(t, formData.eventType));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { eventType } = formData;
      const slug =
        eventType === 'WEDDING' ? `${first(formData.brideName)}-and-${first(formData.groomName)}`
        : eventType === 'PARTY' ? first(formData.brideName)
        : slugifyTitle(formData.eventTitle);
      const wedding = await eventService.create({
        slug,
        eventType,
        name1: eventType === 'WEDDING' || eventType === 'PARTY' ? formData.brideName.trim() : '',
        name2: eventType === 'WEDDING' ? formData.groomName.trim() : '',
        eventTitle: eventType === 'CEREMONY' ? formData.eventTitle.trim() : undefined,
        eventDate: new Date(formData.weddingDate).toISOString(),
        venue: formData.venue.trim(),
        venueAddress: formData.venueAddress.trim(),
        templateId: formData.templateId,
      });
      router.push(`/super-admin/wedding/${wedding.eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionLabel = (text: string) => (
    <p style={{ margin: '0 0 14px', fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{text}</p>
  );

  const fieldLabel = (text: string) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{text}</label>
  );

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--lavender-grey)';
      e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--line-2)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
          Create an <em style={{ fontStyle: 'italic', color: 'var(--lavender-grey-deep)' }}>event</em>
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>Set up a new invitation.</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--thistle-soft)', border: '1px solid var(--thistle)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}
        >
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Event Type ── */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14 }}>
          {sectionLabel('Event type')}
          <div style={{ display: 'flex', gap: 8 }}>
            {EVENT_TYPES.map((et) => (
              <button
                key={et.key}
                type="button"
                onClick={() => setFormData({ ...formData, eventType: et.key })}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${formData.eventType === et.key ? 'var(--lavender-grey-ink)' : 'var(--line-2)'}`,
                  background: formData.eventType === et.key ? 'var(--lavender)' : 'white',
                  color: formData.eventType === et.key ? 'var(--lavender-grey-ink)' : 'var(--muted)',
                  fontSize: 13.5, fontWeight: 500, transition: 'all .15s ease',
                }}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Couple / Honoree / Event Information ── */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14 }}>
          {sectionLabel(
            formData.eventType === 'WEDDING' ? 'Couple information'
              : formData.eventType === 'PARTY' ? 'Honoree information'
              : 'Event information',
          )}
          {formData.eventType === 'WEDDING' && (
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                {fieldLabel("Bride's Name *")}
                <input type="text" value={formData.brideName} onChange={e => setFormData({ ...formData, brideName: e.target.value })}
                  style={inputStyle} {...focusHandlers} placeholder="e.g., Sarah Johnson" required />
              </div>
              <div>
                {fieldLabel("Groom's Name *")}
                <input type="text" value={formData.groomName} onChange={e => setFormData({ ...formData, groomName: e.target.value })}
                  style={inputStyle} {...focusHandlers} placeholder="e.g., Michael Smith" required />
              </div>
            </div>
          )}
          {formData.eventType === 'PARTY' && (
            <div>
              {fieldLabel("Honoree's Name *")}
              <input type="text" value={formData.brideName} onChange={e => setFormData({ ...formData, brideName: e.target.value })}
                style={inputStyle} {...focusHandlers} placeholder="e.g., Aiman" required />
            </div>
          )}
          {formData.eventType === 'CEREMONY' && (
            <div>
              {fieldLabel('Event Title *')}
              <input type="text" value={formData.eventTitle} onChange={e => setFormData({ ...formData, eventTitle: e.target.value })}
                style={inputStyle} {...focusHandlers} placeholder="e.g., Ali's Aqiqah" required />
            </div>
          )}
          {formData.eventType === 'WEDDING' && formData.brideName && formData.groomName && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--lavender)', border: '1px solid var(--lavender-deep)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Auto-generated URL</p>
              <p style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--lavender-grey-ink)', margin: 0 }}>
                /{urlSegmentForEventType(formData.eventType)}/{first(formData.brideName)}-and-{first(formData.groomName)}
              </p>
            </div>
          )}
          {formData.eventType === 'PARTY' && formData.brideName && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--lavender)', border: '1px solid var(--lavender-deep)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Auto-generated URL</p>
              <p style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--lavender-grey-ink)', margin: 0 }}>/{urlSegmentForEventType(formData.eventType)}/{first(formData.brideName)}</p>
            </div>
          )}
          {formData.eventType === 'CEREMONY' && formData.eventTitle && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--lavender)', border: '1px solid var(--lavender-deep)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Auto-generated URL</p>
              <p style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--lavender-grey-ink)', margin: 0 }}>/{urlSegmentForEventType(formData.eventType)}/{slugifyTitle(formData.eventTitle)}</p>
            </div>
          )}
        </div>

        {/* ── Event Details ── */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14 }}>
          {sectionLabel('Event details')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              {fieldLabel('Date & Time *')}
              <input type="datetime-local" value={formData.weddingDate} onChange={e => setFormData({ ...formData, weddingDate: e.target.value })}
                style={inputStyle} {...focusHandlers} required />
            </div>
            <div>
              {fieldLabel('Venue Name *')}
              <input type="text" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })}
                style={inputStyle} {...focusHandlers} placeholder="e.g., Grand Ballroom Hotel" required />
            </div>
            <div>
              {fieldLabel('Venue Address *')}
              <textarea value={formData.venueAddress} onChange={e => setFormData({ ...formData, venueAddress: e.target.value })}
                rows={3} style={{ ...inputStyle, resize: 'none' }} {...focusHandlers}
                placeholder="e.g., 123 Main Street, City, State 12345" required />
            </div>
          </div>
        </div>

        {/* ── Template Selection ── */}
        {visibleTemplates.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 20 }}>
            {sectionLabel('Choose a template')}
            <div className="grid md:grid-cols-2 gap-3">
              {visibleTemplates.map(template => (
                <div
                  key={template.templateId}
                  onClick={() => setFormData({ ...formData, templateId: template.templateId })}
                  style={{
                    borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                    border: `2px solid ${formData.templateId === template.templateId ? 'var(--lavender-grey-ink)' : 'var(--line-2)'}`,
                    background: 'white',
                    transition: 'all .15s ease',
                    boxShadow: formData.templateId === template.templateId ? '0 0 0 3px var(--lavender)' : 'none',
                  }}
                >
                  <TemplatePreview templateCode={template.templateCode} thumbnailUrl={template.thumbnailUrl} />
                  <div style={{ padding: '10px 14px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{template.templateName}</h3>
                        {(() => {
                          const tier = template.tier ?? (template.isPremium ? 'PREMIUM' : 'FREE');
                          const styles: Record<string, React.CSSProperties> = {
                            FREE:    { background: 'var(--sand-1)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' },
                            PREMIUM: { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent-deep)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' },
                            PRO:     { background: 'var(--lavender)', color: 'var(--lavender-grey-deep)', border: '1px solid var(--lavender-deep)' },
                          };
                          const labels: Record<string, string> = { FREE: 'Free', PREMIUM: 'Premium', PRO: 'Pro' };
                          return (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 500, ...(styles[tier] ?? styles.FREE) }}>
                              {labels[tier] ?? tier}
                            </span>
                          );
                        })()}
                      </div>
                      {formData.templateId === template.templateId && <Icon name="check-circle" size={16} style={{ color: 'var(--lavender-grey-ink)' }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0 }}>{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button" onClick={() => router.push('/super-admin')}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'white', border: '1px solid var(--line-2)', color: 'var(--ink-2)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading || formData.templateId === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: (loading || formData.templateId === 0) ? 'var(--muted)' : 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: (loading || formData.templateId === 0) ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(0,0,0,.08)' }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Creating…
              </>
            ) : (
              <><Icon name="plus" size={16} /> Create event</>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
