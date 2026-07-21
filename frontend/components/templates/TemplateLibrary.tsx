'use client';

import { useState } from 'react';
import { Template } from '@/lib/api';
import { TemplatePreview } from './TemplatePreview';
import { UpgradeDialog } from './UpgradeDialog';
import { tierRank, tierLabel } from '@/lib/tierRank';
import { Icon } from '@/components/ui/Icon';

type Tier = 'FREE' | 'PREMIUM' | 'PRO';

const tierBadge: Record<string, { bg: string; color: string }> = {
  FREE:    { bg: 'var(--surface-sunken)',                                              color: 'var(--text-muted)' },
  PREMIUM: { bg: 'color-mix(in srgb, var(--accent) 14%, transparent)',               color: 'var(--accent-deep)' },
  PRO:     { bg: 'color-mix(in srgb, var(--brand) 10%, transparent)',                color: 'var(--brand)' },
};

interface TemplateLibraryProps {
  templates: Template[];
  userTier?: string;
  currentTemplateId?: number;
  onSelect?: (template: Template) => void;
  /** compact = single column, shorter previews (for use inside narrow rails) */
  compact?: boolean;
}

export function TemplateLibrary({
  templates,
  userTier = 'FREE',
  currentTemplateId,
  onSelect,
  compact = false,
}: TemplateLibraryProps) {
  const [upgradeFor, setUpgradeFor] = useState<Template | null>(null);

  const userRank = tierRank(userTier);

  const handleClick = (t: Template) => {
    if (tierRank(t.tier) > userRank) {
      setUpgradeFor(t);
    } else {
      onSelect?.(t);
    }
  };

  if (compact) {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map(t => {
            const locked = tierRank(t.tier) > userRank;
            const active = t.templateId === currentTemplateId;
            const tb = tierBadge[t.tier?.toUpperCase() ?? 'FREE'] ?? tierBadge.FREE;
            return (
              <div
                key={t.templateId}
                onClick={() => handleClick(t)}
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: `2px solid ${active ? 'var(--brand)' : 'var(--border-subtle)'}`,
                  cursor: locked ? 'default' : 'pointer',
                  opacity: !active && locked ? 0.6 : 1,
                  boxShadow: active ? '0 0 0 3px var(--brand-subtle)' : undefined,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                {/* Thumbnail — clipped to ~120px tall */}
                <div style={{ height: 120, overflow: 'hidden', background: '#f3f4f6' }}>
                  <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} />
                </div>

                {/* Lock overlay */}
                {locked && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(1px)',
                  }}>
                    <Icon name="lock" size={22} style={{ color: '#fff', marginBottom: 4 }} />
                    <span style={{ color: '#fff', fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                      {tierLabel[t.tier?.toUpperCase() ?? 'PREMIUM'] ?? t.tier} only
                    </span>
                  </div>
                )}

                {/* Active badge */}
                {active && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--brand)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
                    <span style={{ fontSize: 10, color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>Active</span>
                  </div>
                )}

                {/* Info row */}
                <div style={{ padding: '8px 10px', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.templateName}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-ui)', fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--radius-full)', background: tb.bg, color: tb.color, flexShrink: 0 }}>
                    {tierLabel[t.tier?.toUpperCase() ?? 'FREE'] ?? t.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <UpgradeDialog
          open={!!upgradeFor}
          onClose={() => setUpgradeFor(null)}
          requiredTier={upgradeFor?.tier ?? 'PREMIUM'}
        />
      </>
    );
  }

  // ── Full masonry layout ───────────────────────────────────────────────────────
  return (
    <>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
        {templates.map(t => {
          const locked = tierRank(t.tier) > userRank;
          const active = t.templateId === currentTemplateId;
          const tb = tierBadge[t.tier?.toUpperCase() ?? 'FREE'] ?? tierBadge.FREE;
          return (
            <div
              key={t.templateId}
              className="break-inside-avoid"
              onClick={() => handleClick(t)}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: `2px solid ${active ? 'var(--brand)' : 'var(--border-subtle)'}`,
                cursor: locked ? 'default' : 'pointer',
                opacity: !active && locked ? 0.65 : 1,
                boxShadow: active ? '0 0 0 4px var(--brand-subtle)' : 'var(--shadow-sm)',
                transition: 'border-color 0.15s, box-shadow 0.15s, opacity 0.15s',
                marginBottom: 20,
              }}
            >
              <TemplatePreview templateCode={t.templateCode} thumbnailUrl={t.thumbnailUrl} />

              {/* Lock overlay */}
              {locked && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(2px)',
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
                    <Icon name="lock" size={18} style={{ color: '#fff' }} />
                    <span style={{ color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600 }}>
                      {tierLabel[t.tier?.toUpperCase() ?? 'PREMIUM'] ?? t.tier} only
                    </span>
                  </div>
                </div>
              )}

              {/* Active badge */}
              {active && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--brand)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                  <span style={{ fontSize: 11, color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>Active</span>
                </div>
              )}

              {/* Info footer */}
              <div style={{ padding: '12px 14px', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{t.templateName}</p>
                  {t.description && (
                    <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</p>
                  )}
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--radius-full)', background: tb.bg, color: tb.color, flexShrink: 0, border: '1px solid transparent' }}>
                  {tierLabel[t.tier?.toUpperCase() ?? 'FREE'] ?? t.tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <UpgradeDialog
        open={!!upgradeFor}
        onClose={() => setUpgradeFor(null)}
        requiredTier={upgradeFor?.tier ?? 'PREMIUM'}
      />
    </>
  );
}
