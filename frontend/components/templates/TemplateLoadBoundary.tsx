'use client';

import { Component, useEffect, type ReactNode } from 'react';
import styles from './TemplateLoadBoundary.module.css';

export function TemplateLoading() {
  return <div className={`${styles.state} ${styles.loading}`} role="status" aria-label="Loading invitation">
    <p>Loading invitation…</p>
  </div>;
}

/** Place inside the same Suspense boundary as the template, never beside its fallback. */
export function TemplateReady({ onReady }: { onReady?: () => void }) {
  useEffect(() => { onReady?.(); }, [onReady]);
  return null;
}

export function TemplateUnavailable() {
  return <div className={styles.state} role="alert"><p>This template preview is not available.</p></div>;
}

/** A failed chunk must not silently display a different invitation. Reloading just the preview
 * document retries rejected dynamic imports and restores the draft through PREVIEW_READY/storage. */
export default class TemplateLoadBoundary extends Component<{
  children: ReactNode;
  onRetry?: () => void;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) return <div className={styles.state} role="alert">
      <p>This invitation couldn’t load. Reload the preview to try again.</p>
      <button className={styles.retry} type="button" onClick={this.props.onRetry ?? (() => window.location.reload())}>
        Reload preview
      </button>
    </div>;
    return this.props.children;
  }
}
