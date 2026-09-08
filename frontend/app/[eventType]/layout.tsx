import type { Viewport } from 'next';
import { INVITE_REQUESTED_SCALE } from '@/lib/inviteViewport';

// ── Invitation zoom ───────────────────────────────────────────────────────────
// This is the LITERAL meta-tag value — what we ask the browser for, not what it actually renders
// at (see lib/inviteViewport.ts: `INVITE_REQUESTED_SCALE` vs `INVITE_EFFECTIVE_SCALE` — a real
// measurement showed these differ). Changing this changes what every guest's browser receives; the
// Adjust Editor preview emulates the *effective* result separately, not this literal value.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: INVITE_REQUESTED_SCALE,
};

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
