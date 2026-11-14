'use client';

import { motion } from 'framer-motion';
import { Template } from '@/lib/api';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { tierRank, tierLabel } from '@/lib/tierRank';

type Tier = 'BASIC' | 'PREMIUM' | 'PRO';
const tierBadge: Record<Tier, { bg: string; text: string; label: string }> = {
  BASIC:    { bg: 'bg-[var(--surface-sunken)]',   text: 'text-[var(--text-muted)]',  label: 'Basic' },
  PREMIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Premium' },
  PRO:     { bg: 'bg-[var(--brand-subtle-2)]', text: 'text-[var(--brand)]', label: 'Pro' },
};

interface TemplatesTabProps {
  templates: Template[];
  currentTemplateId: number;
  /** The wedding owner's account tier — gates which templates can actually be applied. */
  weddingTier?: string;
  onChangeTemplate: (templateId: number) => void;
  onPreviewTemplate: (templateId: number) => void;
}

export default function TemplatesTab({
  templates,
  currentTemplateId,
  weddingTier,
  onChangeTemplate,
  onPreviewTemplate,
}: TemplatesTabProps) {
  const currentTemplate = templates.find(t => t.templateId === currentTemplateId);
  const weddingRank = tierRank(weddingTier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-[var(--surface-card)] rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">
            Template Selection
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            Currently using:{' '}
            <span className="font-semibold">
              {currentTemplate?.templateName || `Template ${currentTemplateId}`}
            </span>
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <p className="text-lg">No templates available</p>
            <p className="text-sm mt-2">Templates need to be seeded in the database</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((template) => {
                const t = (template.tier ?? (template.isPremium ? 'PREMIUM' : 'BASIC')) as Tier;
                const tb = tierBadge[t] ?? tierBadge.BASIC;
                const locked = tierRank(t) > weddingRank;
                return (
                <div
                  key={template.templateId}
                  style={{ boxShadow: 'var(--card-shadow)' }}
                  className={`relative rounded-xl overflow-hidden ${
                    currentTemplateId === template.templateId
                      ? 'outline-2 outline-[var(--brand)]'
                      : locked
                      ? 'opacity-70'
                      : ''
                  }`}
                >
                  {/* Tier Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`${tb.bg} ${tb.text} text-xs px-3 py-1 rounded-full font-semibold shadow-sm`}>
                      {tb.label}
                    </span>
                  </div>

                  {/* Active Badge */}
                  {currentTemplateId === template.templateId && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-[var(--brand)] text-[var(--brand-on)] text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                        ✓ Active
                      </span>
                    </div>
                  )}

                  {/* Template Preview */}
                  <TemplatePreview templateCode={template.templateCode} thumbnailUrl={template.thumbnailUrl} />

                  {/* Template Info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-[var(--text-strong)] text-lg mb-1">
                      {template.templateName}
                    </h4>
                    <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => onPreviewTemplate(template.templateId)}
                        className="w-full px-4 py-2 bg-[var(--brand)] text-[var(--brand-on)] rounded-lg hover:bg-[var(--brand-hover)] transition-colors font-medium text-sm"
                      >
                        👁️ Preview
                      </button>

                      {currentTemplateId !== template.templateId && locked && (
                        <div
                          title={`This wedding is on the ${tierLabel[weddingTier?.toUpperCase() ?? 'BASIC'] ?? weddingTier} tier — upgrade to ${tb.label} to use this template.`}
                          className="w-full px-4 py-2 bg-[var(--surface-sunken)] text-[var(--text-subtle)] rounded-lg text-center font-medium text-sm cursor-not-allowed"
                        >
                          🔒 Requires {tb.label} tier
                        </div>
                      )}

                      {currentTemplateId !== template.templateId && !locked && (
                        <button
                          onClick={() => onChangeTemplate(template.templateId)}
                          className="w-full px-4 py-2 bg-[var(--brand)] text-[var(--brand-on)] rounded-lg hover:bg-[var(--brand-hover)] transition-colors font-medium text-sm"
                        >
                          Use This Template
                        </button>
                      )}

                      {currentTemplateId === template.templateId && (
                        <div className="w-full px-4 py-2 bg-[var(--surface-sunken)] text-[var(--text-muted)] rounded-lg text-center font-medium text-sm">
                          Currently Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-[var(--brand-subtle)] rounded-lg border border-[var(--brand-border)]">
          <p className="text-sm text-[var(--text-body)]">
            💡 <strong>Tip:</strong> Click &quot;Preview&quot; to see how the template looks with your wedding data before applying it.
            Changes take effect immediately on the public invitation.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
