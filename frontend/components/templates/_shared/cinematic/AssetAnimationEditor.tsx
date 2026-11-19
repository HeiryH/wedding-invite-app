'use client';

import type { CinematicWorldLayer } from './world';
import type { CinematicSequenceTrack } from './sequence';
import { assetAnimationWindow, compileAssetAnimationTracks, normalizeAssetAnimations, type CinematicAssetAnimation } from './assetAnimations';
import { EditorActions, ConfirmEditorAction } from './EditorActions';
import styles from './CinematicAdjustPanel.module.css';

export default function AssetAnimationEditor({ layer, tracks, layers, disabled, onChange, onSelectTrack, onPreview }: {
  layer: CinematicWorldLayer; tracks: CinematicSequenceTrack[]; disabled?: boolean;
  layers?: CinematicWorldLayer[];
  onChange: (animations: CinematicAssetAnimation[]) => void;
  onSelectTrack?: (id: string) => void; onPreview: (track: CinematicSequenceTrack) => void;
}) {
  const animations = normalizeAssetAnimations(layer.animations);
  const window = assetAnimationWindow(layer, tracks, layers);
  const compiled = compileAssetAnimationTracks(layers ?? [layer], tracks).filter((track) => track.assetAnimation?.layerId === layer.id);
  const patch = (id: string, value: Partial<CinematicAssetAnimation>) => onChange(normalizeAssetAnimations(animations.map((item) => item.id === id ? { ...item, ...value } : item)));
  const sorted = [...animations].sort((a, b) => a.start - b.start);
  if (!animations.length) return null;
  return <details className={styles.timingEditor}>
    <summary>Legacy moves</summary>
    <section className={styles.assetAnimations} aria-label={`In-between animations for ${layer.label}`}>
      <fieldset disabled={disabled} className={styles.animationFields}>
        {sorted.map((item, index) => {
          const track = compiled.find((candidate) => candidate.assetAnimation?.animationId === item.id);
          return <details key={item.id} open className={styles.animationCard}>
            <summary>{index + 1}. {item.label || 'Move'}{!item.enabled ? ' · disabled' : ''}</summary>
            <div className={styles.animationProperties}>
              <label>Name<input aria-label={`Animation name ${index + 1}`} value={item.label} onChange={(event) => patch(item.id, { label: event.target.value })} /></label>
              <label className={styles.animationEnabled}><input type="checkbox" checked={item.enabled} onChange={(event) => patch(item.id, { enabled: event.target.checked })} />Enabled</label>
              <div className={styles.twoColumn}>{(['start', 'end'] as const).map((field) => <label key={field}>{field === 'start' ? 'Start (% story)' : 'End (% story)'}
                <input type="number" step={.1} min={window.start * 100} max={window.end * 100} disabled={!window.span}
                  aria-label={`${field} of animation ${index + 1}`} value={Number(((window.start + item[field] * window.span) * 100).toFixed(2))}
                  onChange={(event) => {
                    if (!event.target.value || !window.span) return;
                    const amount = Math.min(1, Math.max(0, (Number(event.target.value) / 100 - window.start) / window.span));
                    patch(item.id, field === 'start' ? { start: Math.min(amount, item.end) } : { end: Math.max(item.start, amount) });
                  }} /></label>)}</div>
              <div className={styles.actionRow}>
                <button type="button" disabled={!track} onClick={() => track && onPreview(track)}>Preview move</button>
                <button type="button" disabled={!track || !onSelectTrack} onClick={() => track && onSelectTrack?.(track.id)}>Select on timeline</button>
                <EditorActions label={`Animation actions ${index + 1}`}><ConfirmEditorAction label="Remove animation"
                  description={`Remove only “${item.label}” from “${layer.label}”. Other animations and the layer remain.`}
                  onConfirm={() => onChange(animations.filter((animation) => animation.id !== item.id))} /></EditorActions>
              </div>
            </div>
          </details>;
        })}
        {!window.span && <p className={styles.note}>There is no hold between entrance and exit. Extend that interval in Appearance timing first.</p>}
      </fieldset>
    </section>
  </details>;
}
