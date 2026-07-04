'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { weddingService, templateService, packageService, Template, Package } from '@/lib/api';
import Icon from '@/components/admin/Icon';
import { TemplatePreview } from '@/components/templates/TemplatePreview';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
  fontSize: 14, color: 'var(--text-body)', background: 'var(--surface-card)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
};

export default function HostCreateWeddingPage() {
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
      router.push(`/host-admin/wedding/${wedding.weddingId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wedding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionLabel = (text: string) => (
    <p style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>{text}</p>
  );

  const fieldLabel = (text: string) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-ui)' }}>{text}</label>
  );

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--brand)';
      e.currentTarget.style.boxShadow = 'var(--shadow-focus)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--border-default)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 400, letterSpacing: 'var(--tracking-tight)', lineHeight: 1, color: 'var(--text-strong)' }}>
          Create a <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>wedding</em>
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Set up a new wedding invitation.</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16 }}
        >
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontFamily: 'var(--font-ui)' }}>{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Couple Information */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14 }}>
          {sectionLabel('Couple information')}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              {fieldLabel("Bride's name")}
              <input type="text" value={formData.brideName} onChange={e => setFormData({ ...formData, brideName: e.target.value })}
                style={inputStyle} {...focusHandlers} placeholder="e.g., Sarah Johnson" required />
            </div>
            <div>
              {fieldLabel("Groom's name")}
              <input type="text" value={formData.groomName} onChange={e => setFormData({ ...formData, groomName: e.target.value })}
                style={inputStyle} {...focusHandlers} placeholder="e.g., Michael Smith" required />
            </div>
          </div>
          {formData.brideName && formData.groomName && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', fontFamily: 'var(--font-ui)' }}>Auto-generated URL</p>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--brand)', margin: 0 }}>
                /wedding/{formData.brideName.split(' ')[0].toLowerCase()}-and-{formData.groomName.split(' ')[0].toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* Wedding Details */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14 }}>
          {sectionLabel('Wedding details')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              {fieldLabel('Date & time')}
              <input type="datetime-local" value={formData.weddingDate} onChange={e => setFormData({ ...formData, weddingDate: e.target.value })}
                style={inputStyle} {...focusHandlers} required />
            </div>
            <div>
              {fieldLabel('Venue name')}
              <input type="text" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })}
                style={inputStyle} {...focusHandlers} placeholder="e.g., Grand Ballroom Hotel" required />
            </div>
            <div>
              {fieldLabel('Venue address')}
              <textarea value={formData.venueAddress} onChange={e => setFormData({ ...formData, venueAddress: e.target.value })}
                rows={3} style={{ ...inputStyle, resize: 'none' }} {...focusHandlers}
                placeholder="e.g., 123 Main Street, City, State 12345" required />
            </div>
          </div>
        </div>

        {/* Package Selection */}
        {packages.length > 0 && (
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14 }}>
            {sectionLabel('Choose a package')}
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', margin: '-8px 0 14px', fontFamily: 'var(--font-ui)' }}>Select a package to automatically enable its features.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div
                onClick={() => setFormData({ ...formData, packageId: null })}
                style={{
                  padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: `2px solid ${formData.packageId === null ? 'var(--brand)' : 'var(--border-default)'}`,
                  background: formData.packageId === null ? 'var(--brand-subtle)' : 'var(--surface-card)',
                  transition: 'all .15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', fontFamily: 'var(--font-ui)' }}>No package</h3>
                  {formData.packageId === null && <Icon name="check-circle" size={16} style={{ color: 'var(--brand)' }} />}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-ui)' }}>Start with no features. Enable them manually later.</p>
              </div>
              {packages.map(pkg => (
                <div
                  key={pkg.packageId}
                  onClick={() => setFormData({ ...formData, packageId: pkg.packageId })}
                  style={{
                    padding: 16, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `2px solid ${formData.packageId === pkg.packageId ? 'var(--brand)' : 'var(--border-default)'}`,
                    background: formData.packageId === pkg.packageId ? 'var(--brand-subtle)' : 'var(--surface-card)',
                    transition: 'all .15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', fontFamily: 'var(--font-ui)' }}>{pkg.packageName}</h3>
                      {pkg.price > 0 && <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>${pkg.price}</span>}
                    </div>
                    {formData.packageId === pkg.packageId && <Icon name="check-circle" size={16} style={{ color: 'var(--brand)' }} />}
                  </div>
                  {pkg.description && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 8px', fontFamily: 'var(--font-ui)' }}>{pkg.description}</p>}
                  {pkg.features.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {pkg.features.map(f => (
                        <span key={f.featureId} style={{ fontSize: 11, background: 'var(--surface-card)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--brand-border)', fontFamily: 'var(--font-ui)' }}>
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

        {/* Template Selection */}
        {templates.length > 0 && (
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
            {sectionLabel('Choose a template')}
            <div className="grid md:grid-cols-2 gap-3">
              {templates.map(template => (
                <div
                  key={template.templateId}
                  onClick={() => setFormData({ ...formData, templateId: template.templateId })}
                  style={{
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', overflow: 'hidden',
                    border: `2px solid ${formData.templateId === template.templateId ? 'var(--brand)' : 'var(--border-default)'}`,
                    boxShadow: formData.templateId === template.templateId ? 'var(--shadow-focus)' : 'none',
                    transition: 'all .15s ease',
                  }}
                >
                  <TemplatePreview templateCode={template.templateCode} />
                  <div style={{ padding: '10px 14px 14px', background: 'var(--surface-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>{template.templateName}</h3>
                        {template.isPremium && (
                          <span style={{ fontSize: 11, background: 'var(--accent-subtle)', color: 'var(--accent-on)', padding: '2px 8px', borderRadius: 999, fontFamily: 'var(--font-ui)' }}>Premium</span>
                        )}
                      </div>
                      {formData.templateId === template.templateId && <Icon name="check-circle" size={16} style={{ color: 'var(--brand)' }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-ui)' }}>{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button" onClick={() => router.push('/host-admin')}
            style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 'var(--radius-md)', background: loading ? 'var(--text-subtle)' : 'var(--brand)', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', boxShadow: 'var(--shadow-foil)' }}
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
