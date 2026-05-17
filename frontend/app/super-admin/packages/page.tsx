'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { packageService, featureService, Package, Feature, CreatePackage, UpdatePackage } from '@/lib/api';
import Icon from '@/components/admin/Icon';

type FormMode = 'create' | 'edit' | null;

interface PackageForm {
  packageName: string;
  packageCode: string;
  description: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
  featureIds: number[];
}

const emptyForm: PackageForm = {
  packageName: '',
  packageCode: '',
  description: '',
  price: 0,
  sortOrder: 0,
  isActive: true,
  featureIds: [],
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--line-2)', borderRadius: 10,
  fontSize: 14, color: 'var(--ink)', background: 'white',
  outline: 'none', boxSizing: 'border-box',
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pkgs, features] = await Promise.all([packageService.getAll(), featureService.getAll()]);
      setPackages(pkgs);
      setAllFeatures(features);
    } catch {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => { setForm(emptyForm); setEditingId(null); setFormMode('create'); setError(null); };

  const openEditForm = (pkg: Package) => {
    setForm({
      packageName: pkg.packageName, packageCode: pkg.packageCode,
      description: pkg.description, price: pkg.price,
      sortOrder: pkg.sortOrder, isActive: pkg.isActive,
      featureIds: pkg.features.map(f => f.featureId),
    });
    setEditingId(pkg.packageId);
    setFormMode('edit');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (formMode === 'create') {
        const payload: CreatePackage = { packageName: form.packageName, packageCode: form.packageCode, description: form.description, price: form.price, sortOrder: form.sortOrder, featureIds: form.featureIds };
        await packageService.create(payload);
      } else if (formMode === 'edit' && editingId !== null) {
        const payload: UpdatePackage = { packageName: form.packageName, description: form.description, price: form.price, isActive: form.isActive, sortOrder: form.sortOrder, featureIds: form.featureIds };
        await packageService.update(editingId, payload);
      }
      setFormMode(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Delete package "${pkg.packageName}"? Weddings using this package will have their package unset.`)) return;
    try { await packageService.delete(pkg.packageId); await fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed to delete package'); }
  };

  const toggleFeature = (featureId: number) => {
    setForm(prev => ({
      ...prev,
      featureIds: prev.featureIds.includes(featureId)
        ? prev.featureIds.filter(id => id !== featureId)
        : [...prev.featureIds, featureId],
    }));
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--lavender-grey-ink)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading packages…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--ink)' }}>
            Manage <em style={{ fontStyle: 'italic', color: 'var(--lavender-grey-deep)' }}>packages</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>Create and manage feature bundles for weddings.</p>
        </div>
        <button
          onClick={openCreateForm}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, background: 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, flexShrink: 0, boxShadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(0,0,0,.08)' }}
        >
          <Icon name="plus" size={16} /> New package
        </button>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {formMode && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 24, marginBottom: 20 }}
          >
            <h2 style={{ margin: '0 0 20px', fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {formMode === 'create' ? 'Create new package' : 'Edit package'}
            </h2>

            {error && (
              <div style={{ background: 'var(--thistle-soft)', border: '1px solid var(--thistle)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-5" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Package Name *</label>
                  <input
                    type="text" value={form.packageName}
                    onChange={e => setForm({ ...form, packageName: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="e.g., Starter, Premium" required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Package Code * {formMode === 'edit' && <span style={{ fontWeight: 400, textTransform: 'none' }}>(read-only)</span>}
                  </label>
                  <input
                    type="text" value={form.packageCode}
                    onChange={e => setForm({ ...form, packageCode: e.target.value.toUpperCase() })}
                    style={{ ...inputStyle, background: formMode === 'edit' ? 'var(--floral)' : 'white', color: formMode === 'edit' ? 'var(--muted)' : 'var(--ink)' }}
                    onFocus={e => { if (formMode !== 'edit') { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; } }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="e.g., STARTER" required disabled={formMode === 'edit'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="Brief description of this package"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-5" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Price ($)</label>
                  <input
                    type="number" min="0" step="0.01" value={form.price}
                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Sort Order</label>
                  <input
                    type="number" min="0" value={form.sortOrder}
                    onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--lavender-grey)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--lavender)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {formMode === 'edit' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox" checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: 'var(--lavender-grey-ink)' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Active</span>
                    </label>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Included Features</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allFeatures.map(feature => {
                    const checked = form.featureIds.includes(feature.featureId);
                    return (
                      <label
                        key={feature.featureId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                          border: `1px solid ${checked ? 'var(--lavender-deep)' : 'var(--line-2)'}`,
                          background: checked ? 'var(--lavender)' : 'white',
                          opacity: feature.isActive ? 1 : 0.5,
                          transition: 'all .15s ease',
                        }}
                      >
                        <input
                          type="checkbox" checked={checked}
                          onChange={() => toggleFeature(feature.featureId)}
                          style={{ width: 15, height: 15, accentColor: 'var(--lavender-grey-ink)', flexShrink: 0 }}
                        />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', margin: 0 }}>{feature.featureName}</p>
                          {feature.isPremium && <span style={{ fontSize: 11, color: 'var(--lavender-grey-deep)' }}>Premium</span>}
                          {!feature.isActive && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Inactive</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => { setFormMode(null); setError(null); }}
                  style={{ padding: '9px 18px', borderRadius: 10, background: 'white', border: '1px solid var(--line-2)', color: 'var(--ink-2)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  style={{ padding: '9px 18px', borderRadius: 10, background: saving ? 'var(--muted)' : 'var(--lavender-grey-ink)', color: 'var(--floral)', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Saving…' : formMode === 'create' ? 'Create package' : 'Save changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Packages list */}
      {packages.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '1px dashed var(--line-2)', borderRadius: 12, background: 'var(--floral)' }}>
          No packages yet. Create one to get started!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.packageId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: 'white', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)', padding: 20,
                opacity: pkg.isActive ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{pkg.packageName}</h3>
                    {!pkg.isActive && (
                      <span style={{ fontSize: 11, background: 'var(--thistle-soft)', color: 'var(--muted)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--thistle)' }}>Inactive</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', background: 'var(--floral)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)' }}>
                    {pkg.packageCode}
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {pkg.price > 0
                    ? <span style={{ fontSize: 20, fontFamily: 'var(--serif)', color: 'var(--ink)', letterSpacing: '-0.01em' }}>${pkg.price}</span>
                    : <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lavender-grey-deep)' }}>Free</span>}
                </div>
              </div>

              {pkg.description && (
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 14px' }}>{pkg.description}</p>
              )}

              {pkg.features.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>Included features</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pkg.features.map(f => (
                      <span key={f.featureId} style={{ fontSize: 12, background: 'var(--lavender)', color: 'var(--lavender-grey-ink)', padding: '4px 10px', borderRadius: 999, border: '1px solid var(--lavender-deep)', fontWeight: 500 }}>
                        {f.featureName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', margin: '0 0 14px' }}>No features included</p>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <button
                  onClick={() => openEditForm(pkg)}
                  style={{ padding: '7px 14px', background: 'var(--lavender)', color: 'var(--lavender-grey-ink)', border: '1px solid var(--lavender-deep)', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pkg)}
                  style={{ padding: '7px 14px', background: 'var(--thistle-soft)', color: 'var(--ink-2)', border: '1px solid var(--thistle)', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
