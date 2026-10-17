'use client';

import { useState } from 'react';
import type { CinematicWorldLayer } from './world';
import type { CinematicSequenceTrack, CinematicEasing } from './sequence';
import { assetAnimationWindow, compileAssetAnimationTracks, NEUTRAL_ASSET_MOTION, normalizeAssetAnimations, type CinematicAssetAnimation } from './assetAnimations';
import { nextSceneSetId } from './sceneSetEditing';
import styles from './CinematicAdjustPanel.module.css';

const presets = {
  left: { label: 'Move left', x: -10 }, right: { label: 'Move right', x: 10 },
  up: { label: 'Move up', y: -10 }, down: { label: 'Move down', y: 10 },
  return: { label: 'Return to original', ...NEUTRAL_ASSET_MOTION },
};
export default function AssetAnimationEditor({ layer, tracks, layers, disabled, onChange, onSelectTrack, onPreview }: {
  layer: CinematicWorldLayer; tracks: CinematicSequenceTrack[]; disabled?: boolean;
  layers?: CinematicWorldLayer[];
  onChange: (animations: CinematicAssetAnimation[]) => void;
  onSelectTrack?: (id: string) => void; onPreview: (track: CinematicSequenceTrack) => void;
}) {
  const [preset, setPreset] = useState<keyof typeof presets>('left');
  const animations = normalizeAssetAnimations(layer.animations);
  const window = assetAnimationWindow(layer, tracks, layers);
  const compiled = compileAssetAnimationTracks(layers ?? [layer], tracks).filter((track) => track.assetAnimation?.layerId === layer.id);
  const patch = (id: string, value: Partial<CinematicAssetAnimation>) => onChange(normalizeAssetAnimations(animations.map((item) => item.id === id ? { ...item, ...value } : item)));
  const sorted = [...animations].sort((a, b) => a.start - b.start);
  return <section className={styles.assetAnimations} aria-label={`In-between animations for ${layer.label}`}>
    <h4>In-between animations</h4>
    <p className={styles.note}>Moves run after entrance and before exit. Each starts from the previous pose and holds its destination. Scroll back to reverse them.</p>
    <p className={styles.note}>Available: {(window.start * 100).toFixed(1)}%–{(window.end * 100).toFixed(1)}% of the story. Destinations are offsets from the original asset position.</p>
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
            <label>Easing<select aria-label={`Easing of animation ${index + 1}`} value={item.easing} onChange={(event) => patch(item.id, { easing: event.target.value as CinematicEasing })}>
              <option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option><option value="ease-in-out">Ease in / out</option>
            </select></label>
            <div className={styles.twoColumn}>{(['x', 'y', 'scale', 'rotate'] as const).map((field) => <label key={field}>
              {({ x: 'Horizontal (% screen)', y: 'Vertical (% screen)', scale: 'Scale', rotate: 'Rotation (°)' })[field]}
              <input type="number" aria-label={`${field} of animation ${index + 1}`} step={field === 'scale' ? .05 : .5}
                min={field === 'scale' ? .05 : field === 'rotate' ? -360 : -200} max={field === 'scale' ? 10 : field === 'rotate' ? 360 : 200}
                value={item[field]} onChange={(event) => { if (event.target.value !== '') patch(item.id, { [field]: Number(event.target.value) }); }} /></label>)}</div>
            <div className={styles.actionRow}>
              <button type="button" disabled={!track} onClick={() => track && onPreview(track)}>Preview move</button>
              <button type="button" disabled={!track || !onSelectTrack} onClick={() => track && onSelectTrack?.(track.id)}>Select on timeline</button>
              <button type="button" onClick={() => onChange(animations.filter((animation) => animation.id !== item.id))}>Remove animation</button>
            </div>
          </div>
        </details>;
      })}
      {!window.span && <p className={styles.note}>There is no hold between entrance and exit. Extend that interval in Appearance timing first.</p>}
      <div className={styles.animationAdd}>
        <select aria-label="New animation type" value={preset} onChange={(event) => setPreset(event.target.value as keyof typeof presets)}>
          {Object.entries(presets).map(([id, value]) => <option key={id} value={id}>{value.label}</option>)}
        </select>
        <button type="button" disabled={!window.span || animations.length >= 50} onClick={() => {
          const previous = sorted.at(-1);
          const start = Math.min(.75, previous?.end ?? 0);
          const item: CinematicAssetAnimation = { ...NEUTRAL_ASSET_MOTION,
            ...(previous ? { x: previous.x, y: previous.y, scale: previous.scale, rotate: previous.rotate } : {}),
            ...presets[preset], id: nextSceneSetId('move', animations.map((item) => item.id)),
            enabled: true, start, end: Math.min(1, start + .25), easing: 'ease-in-out' };
          onChange([...animations, item]);
        }}>Add animation</button>
      </div>
    </fieldset>
  </section>;
}
