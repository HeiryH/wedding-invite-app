'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, templateService, packageService, Template, Package } from '@/lib/api';
import Icon from '@/components/admin/Icon';
import { TemplatePreview } from '@/components/templates/TemplatePreview';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--line-2)', borderRadius: 10,
  fontSize: 14, color: 'var(--ink)', background: 'white',
  outline: 'none', boxSizing: 'border-box',
};

export default function CreateWeddingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    venueAddress: '',
    templateId: 1,
    packageId: null as number | null,
  });

  useEffect(() => {
    templateService.getActive().then(setTemplates).catch(() => {});
    packageService.getActive().then(setPackages).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const wedding = await weddingService.create({
        coupleName: `${formData.brideName.split(' ')[0].toLowerCase()}-and-${formData.groomName.split(' ')[0].toLowerCase()}`,
        brideName: formData.brideName.trim(),
        groomName: formData.groomName.trim(),
        weddingDate: new Date(formData.weddingDate).toISOString(),
        venue: formData.venue.trim(),
        venueAddress: formData.venueAddress.trim(),
        templateId: formData.templateId,
        packageId: formData.packageId ?? undefined,
      });
      router.push(`/super-admin/wedding/${wedding.weddingId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wedding. Please try again.');
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
          Create a <em style={{ fontStyle: 'italic', color: 'var(--lavender-grey-deep)' }}>wedding</em>
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>Set up a new wedding invitation.</p>
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
        {/* ── Couple Information ── */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14 }}>
          {sectionLabel('Couple information')}
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
          {formData.brideName && formData.groomName && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--lavender)', border: '1px solid var(--lavender-deep)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Auto-generated URL</p>
              <p style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--lavender-grey-ink)', margin: 0 }}>
                /wedding/{formData.brideName.split(' ')[0].toLowerCase()}-and-{formData.groomName.split(' ')[0].toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* ── Wedding Details ── */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14 }}>
          {sectionLabel('Wedding details')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              {fieldLabel('Wedding Date & Time *')}
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

        {/* ── Package Selection ── */}
        {packages.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 14 }}>
            {sectionLabel('Choose a package')}
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '-8px 0 14px' }}>Select a package to automatically enable its features. You can change this later.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {/* No package */}
              <div
                onClick={() => setFormData({ ...formData, packageId: null })}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${formData.packageId === null ? 'var(--lavender-grey-ink)' : 'var(--line-2)'}`,
                  background: formData.packageId === null ? 'var(--lavender)' : 'white',
                  transition: 'all .15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No Package</h3>
                  {formData.packageId === null && <Icon name="check-circle" size={16} style={{ color: 'var(--lavender-grey-ink)' }} />}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: 0 }}>Start with no features. Enable them manually later.</p>
              </div>

              {packages.map(pkg => (
                <div
                  key={pkg.packageId}
                  onClick={() => setFormData({ ...formData, packageId: pkg.packageId })}
                  style={{
                    padding: 16, borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${formData.packageId === pkg.packageId ? 'var(--lavender-grey-ink)' : 'var(--line-2)'}`,
                    background: formData.packageId === pkg.packageId ? 'var(--lavender)' : 'white',
                    transition: 'all .15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{pkg.packageName}</h3>
                      {pkg.price > 0 && <span style={{ fontSize: 12, color: 'var(--lavender-grey-deep)', fontWeight: 500 }}>${pkg.price}</span>}
                    </div>
                    {formData.packageId === pkg.packageId && <Icon name="check-circle" size={16} style={{ color: 'var(--lavender-grey-ink)' }} />}
                  </div>
                  {pkg.description && <p style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: '0 0 8px' }}>{pkg.description}</p>}
                  {pkg.features.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {pkg.features.map(f => (
                        <span key={f.featureId} style={{ fontSize: 11, background: 'rgba(255,255,255,.7)', color: 'var(--lavender-grey-ink)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--lavender-deep)' }}>
                          {f.featureName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Template Selection ── */}
        {templates.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 20 }}>
            {sectionLabel('Choose a template')}
            <div className="grid md:grid-cols-2 gap-3">
              {templates.map(template => (
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
                  <TemplatePreview templateCode={template.templateCode} />
                  <div style={{ padding: '10px 14px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{template.templateName}</h3>
                        {template.isPremium && (
                          <span style={{ fontSize: 11, background: 'var(--thistle-soft)', color: 'var(--ink-2)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--thistle)' }}>Premium</span>
                        )}
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
            type="submit" disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: loading ? 'var(--muted)' : 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(0,0,0,.08)' }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Creating…
              </>
            ) : (
              <><Icon name="plus" size={16} /> Create wedding</>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
