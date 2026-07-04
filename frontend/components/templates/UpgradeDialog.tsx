'use client';

import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { tierLabel } from '@/lib/tierRank';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  requiredTier?: string;
}

export function UpgradeDialog({ open, onClose, requiredTier = 'PREMIUM' }: UpgradeDialogProps) {
  const label = tierLabel[requiredTier.toUpperCase()] ?? requiredTier;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      tone="brand"
      icon="sparkles"
      title={`Upgrade to ${label}`}
      description={`This template is exclusive to ${label} accounts. Contact us to upgrade and unlock all ${label} designs.`}
      footer={
        <>
          <Button variant="secondary" tone="neutral" size="sm" onClick={onClose}>
            Maybe later
          </Button>
          <Button variant="primary" tone="brand" size="sm" onClick={onClose}>
            Contact us to upgrade
          </Button>
        </>
      }
    />
  );
}
