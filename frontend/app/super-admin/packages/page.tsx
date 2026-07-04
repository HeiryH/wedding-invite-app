'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { packageService, featureService, Package, Feature, CreatePackage, UpdatePackage } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

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
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading packages…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: 'var(--tracking-tight)', lineHeight: 1, color: 'var(--text-strong)' }}>
            Manage <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>packages</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
            Create and manage feature bundles for weddings.
          </p>
        </div>
        <Button
          variant="primary"
          tone="brand"
          iconLeft={<Icon name="plus" size={15} />}
          onClick={openCreateForm}
        >
          New package
        </Button>
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {formMode && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{ marginBottom: 24 }}
          >
            <Card padding="24px">
              <h2 style={{ margin: '0 0 20px', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>
                {formMode === 'create' ? 'Create new package' : 'Edit package'}
              </h2>

              {error && (
                <div style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="alert-circle" size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontFamily: 'var(--font-ui)' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-5" style={{ marginBottom: 16 }}>
                  <Input
                    label="Package Name"
                    required
                    value={form.packageName}
                    onChange={e => setForm({ ...form, packageName: e.target.value })}
                    placeholder="e.g., Starter, Premium"
                  />
                  <Input
                    label={formMode === 'edit' ? 'Package Code (read-only)' : 'Package Code'}
                    required
                    value={form.packageCode}
                    onChange={e => setForm({ ...form, packageCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., STARTER"
                    disabled={formMode === 'edit'}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Textarea
                    label="Description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description of this package"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-5" style={{ marginBottom: 16 }}>
                  <Input
                    label="Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(form.price)}
                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    label="Sort Order"
                    type="number"
                    min="0"
                    value={String(form.sortOrder)}
                    onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                  {formMode === 'edit' && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 'var(--control-md)' }}>
                        <Switch
                          checked={form.isActive}
                          onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-body)' }}>
                          Active
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feature checkboxes */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 10px' }}>
                    Included Features
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allFeatures.map(feature => {
                      const checked = form.featureIds.includes(feature.featureId);
                      return (
                        <label
                          key={feature.featureId}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            border: `1px solid ${checked ? 'var(--brand-border)' : 'var(--border-default)'}`,
                            background: checked ? 'var(--brand-subtle)' : 'var(--surface-card)',
                            opacity: feature.isActive ? 1 : 0.5,
                            transition: 'var(--transition-control)',
                          }}
                        >
                          <input
                            type="checkbox" checked={checked}
                            onChange={() => toggleFeature(feature.featureId)}
                            style={{ width: 15, height: 15, accentColor: 'var(--brand)', flexShrink: 0 }}
                          />
                          <div>
                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-strong)', margin: 0, fontFamily: 'var(--font-ui)' }}>
                              {feature.featureName}
                            </p>
                            {feature.isPremium && (
                              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--gold-500)', fontWeight: 600 }}>Premium</span>
                            )}
                            {!feature.isActive && (
                              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-subtle)' }}>Inactive</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <Button
                    variant="secondary"
                    tone="neutral"
                    type="button"
                    onClick={() => { setFormMode(null); setError(null); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    tone="brand"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : formMode === 'create' ? 'Create package' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Packages list */}
      {packages.length === 0 ? (
        <EmptyState
          icon="package"
          title="No packages yet"
          description="Create your first package to bundle features for weddings."
          action={<Button variant="primary" tone="brand" iconLeft={<Icon name="plus" size={15} />} onClick={openCreateForm}>New package</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.packageId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card padding="20px" style={{ opacity: pkg.isActive ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {pkg.packageName}
                      </h3>
                      {!pkg.isActive && <Badge tone="neutral">Inactive</Badge>}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      {pkg.packageCode}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {pkg.price > 0
                      ? <span style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>${pkg.price}</span>
                      : <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--success)' }}>Free</span>}
                  </div>
                </div>

                {pkg.description && (
                  <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', margin: '0 0 14px', lineHeight: 1.5 }}>
                    {pkg.description}
                  </p>
                )}

                {pkg.features.length > 0 ? (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', margin: '0 0 8px' }}>
                      Included features
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {pkg.features.map(f => (
                        <Badge key={f.featureId} tone="brand">{f.featureName}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-subtle)', fontStyle: 'italic', margin: '0 0 14px' }}>
                    No features included
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <Button variant="soft" tone="brand" size="sm" onClick={() => openEditForm(pkg)}>
                    Edit
                  </Button>
                  <Button variant="soft" tone="danger" size="sm" onClick={() => handleDelete(pkg)}>
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
