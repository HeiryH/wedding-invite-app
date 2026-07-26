'use client';

import { motion } from 'framer-motion';
import { WeddingFeature } from '@/lib/api';
import { FeatureToggle } from '@/components/ui/FeatureToggle';
import { Icon } from '@/components/ui/Icon';

const FEATURE_ICONS: Record<string, string> = {
  PHOTO_BOOTH:   'camera',
  RSVP:          'check-circle',
  WISHES:        'message-circle',
  CUSTOM_DOMAIN: 'link',
};

interface FeaturesTabProps {
  features: WeddingFeature[];
  onToggle: (featureId: number, featureCode: string, currentStatus: boolean) => void;
}

export default function FeaturesTab({ features, onToggle }: FeaturesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px', borderRadius: 'var(--radius-md)',
        background: 'var(--brand-subtle)', border: '1px solid var(--brand-border)',
        marginBottom: 20,
      }}>
        <Icon name="info" size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', color: 'var(--brand)', lineHeight: 1.5 }}>
          Disabling a feature hides its corresponding tab on the public invitation.
        </p>
      </div>

      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-sunken)',
          fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
          fontWeight: 600, color: 'var(--text-muted)',
          letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase',
        }}>
          Features
        </div>
        {features.map((feature, i) => (
          <FeatureToggle
            key={feature.featureId}
            icon={FEATURE_ICONS[feature.featureCode] ?? 'sparkles'}
            title={feature.featureName}
            description={feature.isEnabled ? 'Visible on the public invitation' : 'Hidden from guests'}
            enabled={feature.isEnabled}
            onChange={() => onToggle(feature.featureId, feature.featureCode, feature.isEnabled)}
            style={{
              border: 'none',
              borderBottom: i < features.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              borderRadius: 0,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
