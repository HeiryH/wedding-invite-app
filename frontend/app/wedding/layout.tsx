import type { Viewport } from 'next';

// ── Invitation zoom ───────────────────────────────────────────────────────────
// Adjust initialScale to zoom the invitation in/out.
// 1.0 = 100% (default), 0.9 = slightly zoomed out, 0.85 = more zoomed out
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 0.9,
};

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
