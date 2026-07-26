'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { templateService, TemplateWithUsage } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

type Tier = 'FREE' | 'PREMIUM' | 'PRO';

const TIERS: { value: Tier; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PRO', label: 'Pro' },
];

const tierBadge: Record<Tier, { tone: 'neutral' | 'gold' | 'brand'; label: string }> = {
  FREE: { tone: 'neutral', label: 'Free' },
  PREMIUM: { tone: 'gold', label: 'Premium' },
  PRO: { tone: 'brand', label: 'Pro' },
};

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AuthoringListPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<Tier>('FREE');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const all = await templateService.getUsage();
      setTemplates(all.filter((t) => t.isAuthored));
    } catch {
      setError('Failed to load authored templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await templateService.create({
        templateName: name.trim(),
        templateCode: code.trim() || slugify(name),
        description: description.trim(),
        tier,
      });
      router.push(`/super-admin/authoring/${created.templateId}`);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create template');
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2.5px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>Loading templates…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, letterSpacing: 'var(--tracking-tight)', lineHeight: 1, color: 'var(--text-strong)' }}>
            Template <em style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>authoring</em>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)' }}>
            Build a new template as data — stages, layers, backgrounds — no React component needed.
          </p>
        </div>
        <Button variant="primary" tone="brand" onClick={() => setCreating((c) => !c)}>
          {creating ? 'Cancel' : '+ New template'}
        </Button>
      </div>

      {error && (
        <div style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="alert-circle" size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontFamily: 'var(--font-ui)' }}>{error}</p>
        </div>
      )}

      {creating && (
        <Card style={{ padding: 20, marginBottom: 24 }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Input
                label="Template name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!codeTouched) setCode(slugify(e.target.value));
                }}
                placeholder="e.g. Coastal Minimal"
              />
              <Input
                label="Code (slug)"
                required
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeTouched(true); }}
                placeholder="coastal-minimal"
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', margin: '0 0 8px' }}>
                Tier
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {TIERS.map((t) => (
                  <Button
                    key={t.value}
                    type="button"
                    size="sm"
                    variant={tier === t.value ? 'primary' : 'secondary'}
                    tone={tier === t.value ? 'brand' : 'neutral'}
                    onClick={() => setTier(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" tone="brand" type="submit" disabled={saving || !name.trim() || !code.trim()}>
                {saving ? 'Creating…' : 'Create & open editor'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {templates.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          No authored templates yet. Create one to get started.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => {
            const tb = tierBadge[t.tier] ?? tierBadge.FREE;
            return (
              <motion.div key={t.templateId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card padding="0" style={{ opacity: t.isActive ? 1 : 0.6, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => router.push(`/super-admin/authoring/${t.templateId}`)}>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} />
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {t.templateName}
                      </h3>
                      <Badge tone={tb.tone}>{tb.label}</Badge>
                      {!t.isActive && <Badge tone="neutral">Draft</Badge>}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-ui)', color: 'var(--text-subtle)', margin: '0 0 10px' }}>
                      {t.templateCode} · used by {t.weddingCount} {t.weddingCount === 1 ? 'wedding' : 'weddings'}
                    </p>
                    <Button variant="soft" tone="brand" size="sm">Open editor</Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
