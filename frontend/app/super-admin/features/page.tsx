'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { featureService, FeatureWithUsage, UpdateFeature } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface EditForm {
  featureName: string;
  description: string;
  isPremium: boolean;
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EditForm>({ featureName: '', description: '', isPremium: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFeatures(await featureService.getUsage());
    } catch {
      setError('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const persist = async (feature: FeatureWithUsage, changes: Partial<UpdateFeature>) => {
    const payload: UpdateFeature = {
      featureName: feature.featureName,
      description: feature.description,
      isPremium: feature.isPremium,
      isActive: feature.isActive,
      sortOrder: feature.sortOrder,
      ...changes,
    };
    return featureService.update(feature.featureId, payload);
  };

  const handleToggleActive = async (feature: FeatureWithUsage) => {
    const next = !feature.isActive;
    setBusyId(feature.featureId);
    // optimistic update (keeps position; ranking re-settles on next load)
    setFeatures(prev => prev.map(f => f.featureId === feature.featureId ? { ...f, isActive: next } : f));
    try {
      await persist(feature, { isActive: next });
    } catch {
      // revert
      setFeatures(prev => prev.map(f => f.featureId === feature.featureId ? { ...f, isActive: feature.isActive } : f));
      setError('Failed to update feature');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (feature: FeatureWithUsage) => {
    setForm({ featureName: feature.featureName, description: feature.description, isPremium: feature.isPremium });
    setEditingId(feature.featureId);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent, feature: FeatureWithUsage) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await persist(feature, form);
      setFeatures(prev => prev.map(f => f.featureId === feature.featureId ? { ...f, ...updated } : f));
      setEditingId(null);
    } catch {
      setError('Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = features.filter(f => f.isActive).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading features…</p>
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
            Manage <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>features</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
            {activeCount} active · ranked by how many weddings use each feature.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="alert-circle" size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontFamily: 'var(--font-ui)' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((feature, index) => {
          const isEditing = editingId === feature.featureId;
          return (
            <motion.div
              key={feature.featureId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card padding="18px" style={{ opacity: feature.isActive ? 1 : 0.55 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  {/* Left: info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {feature.featureName}
                      </h3>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        {feature.featureCode}
                      </span>
                      {feature.isPremium && <Badge tone="gold">Premium</Badge>}
                      {!feature.isActive && <Badge tone="neutral">Inactive</Badge>}
                    </div>
                    {feature.description && (
                      <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-body)', margin: '0 0 8px', lineHeight: 1.5 }}>
                        {feature.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="users" size={13} style={{ color: 'var(--text-subtle)' }} />
                      <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}>
                        Used by <strong style={{ color: 'var(--text-strong)' }}>{feature.weddingCount}</strong> {feature.weddingCount === 1 ? 'wedding' : 'weddings'}
                      </span>
                    </div>
                  </div>

                  {/* Right: controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch
                        checked={feature.isActive}
                        disabled={busyId === feature.featureId}
                        onChange={() => handleToggleActive(feature)}
                      />
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-body)' }}>
                        Active
                      </span>
                    </div>
                    <Button variant="soft" tone="brand" size="sm" onClick={() => (isEditing ? setEditingId(null) : openEdit(feature))}>
                      {isEditing ? 'Close' : 'Edit'}
                    </Button>
                  </div>
                </div>

                {/* Inline edit form */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <form onSubmit={e => handleSave(e, feature)} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ marginBottom: 14 }}>
                          <Input
                            label="Feature Name"
                            required
                            value={form.featureName}
                            onChange={e => setForm({ ...form, featureName: e.target.value })}
                          />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <Textarea
                            label="Description"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <Switch
                            checked={form.isPremium}
                            onChange={e => setForm({ ...form, isPremium: e.target.checked })}
                          />
                          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-body)' }}>
                            Premium feature
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                          <Button variant="secondary" tone="neutral" type="button" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                          <Button variant="primary" tone="brand" type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
