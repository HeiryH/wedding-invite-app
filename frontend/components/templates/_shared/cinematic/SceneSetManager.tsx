'use client';

import { useId, useState } from 'react';
import type { CinematicSceneSet } from './sceneSets';
import { nextSceneSetId, type SceneSetAction } from './sceneSetEditing';
import type { CinematicSequenceTrack } from './sequence';
import type { CinematicWorldLayer } from './world';
import styles from './CinematicAdjustPanel.module.css';

export default function SceneSetManager({ sets, layers, tracks, selectedId, onSelect, onAction }: {
  sets: CinematicSceneSet[];
  layers: CinematicWorldLayer[];
  tracks: CinematicSequenceTrack[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onAction: (action: SceneSetAction) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const contentId = useId();
  const [name, setName] = useState('');
  const [space, setSpace] = useState<CinematicSceneSet['space']>('world');
  const [deleting, setDeleting] = useState<string>();
  const [moveTo, setMoveTo] = useState('');
  const active = sets.find((set) => set.id === selectedId);
  const ordered = [...sets].sort((a, b) => a.z - b.z);
  return (
    <section className={styles.sceneSetsManager} data-collapsed={collapsed} aria-label="Scene set manager">
      <div className={styles.sceneSetsHeading}>
        <button type="button" className={styles.sceneSetsToggle} aria-label={`${collapsed ? 'Expand' : 'Collapse'} scene sets`}
          aria-expanded={!collapsed} aria-controls={contentId} onClick={() => setCollapsed(!collapsed)}>
          <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span><strong>Scene sets</strong><small>{sets.length}</small>
        </button>
        <button type="button" onClick={() => { setCollapsed(false); setCreating(!creating); }} aria-expanded={creating}>+ New set</button>
      </div>
      <div id={contentId} hidden={collapsed}>
      <p className={styles.note}>Select a set to manage its space, timing and layers. Order is back to front within each space.</p>
      {creating && (
        <form className={styles.sceneSetForm} onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          const id = nextSceneSetId(name, sets.map((set) => set.id));
          onAction({ type: 'create', id, label: name, space });
          onSelect(id);
          setName(''); setCreating(false);
        }}>
          <label>Set name<input className={styles.field} autoFocus value={name} required maxLength={120} onChange={(event) => setName(event.target.value)} /></label>
          <label>Coordinate space<select aria-label="Coordinate space" className={styles.field} value={space} onChange={(event) => setSpace(event.target.value as CinematicSceneSet['space'])}>
            <option value="world">World · follows the camera</option><option value="viewport">Viewport · stays on screen</option>
          </select></label>
          <div className={styles.sceneSetActions}><button type="button" onClick={() => setCreating(false)}>Cancel</button><button type="submit" disabled={!name.trim()}>Create scene set</button></div>
        </form>
      )}
      <div className={styles.sceneSetList} role="region" aria-label="Scene sets" tabIndex={0}>
        {ordered.map((set, index) => (
          <div key={set.id} className={`${styles.sceneSetRow} ${selectedId === set.id ? styles.sceneSetSelected : ''}`}>
            <button type="button" className={styles.sceneSetName} aria-label={`Manage ${set.label}`} aria-pressed={selectedId === set.id}
              onClick={() => { onSelect(selectedId === set.id ? undefined : set.id); setDeleting(undefined); }}>
              <strong>{set.label}</strong><small>{set.space === 'world' ? 'World' : 'Viewport'} · {layers.filter((layer) => layer.group === set.id).length} layers{set.system ? ' · System' : ''}</small>
            </button>
            <div className={styles.sceneSetRowActions}>
              <button type="button" disabled={set.locked} aria-label={`${set.hidden ? 'Show' : 'Hide'} scene set ${set.label}`} aria-pressed={set.hidden}
                onClick={() => onAction({ type: 'patch', id: set.id, patch: { hidden: !set.hidden } })}>{set.hidden ? 'Show' : 'Hide'}</button>
              <button type="button" aria-label={`${set.locked ? 'Unlock' : 'Lock'} scene set ${set.label}`} aria-pressed={set.locked}
                onClick={() => onAction({ type: 'patch', id: set.id, patch: { locked: !set.locked } })}>{set.locked ? 'Unlock' : 'Lock'}</button>
              <button type="button" disabled={index === 0 || set.locked} aria-label={`Move ${set.label} backward`} onClick={() => onAction({ type: 'reorder', id: set.id, direction: -1 })}>↓</button>
              <button type="button" disabled={index === ordered.length - 1 || set.locked} aria-label={`Move ${set.label} forward`} onClick={() => onAction({ type: 'reorder', id: set.id, direction: 1 })}>↑</button>
            </div>
          </div>
        ))}
      </div>
      {active && (
        <section className={styles.sceneSetForm} aria-label={`Scene set properties ${active.label}`}>
          <label>Name<input key={`${active.id}-${active.label}`} className={styles.field} defaultValue={active.label} disabled={active.locked} maxLength={120}
            onBlur={(event) => {
              const label = event.target.value.trim();
              if (label && label !== active.label) onAction({ type: 'patch', id: active.id, patch: { label } });
              else event.target.value = active.label;
            }} /></label>
          <label>Coordinate space<select aria-label="Coordinate space" className={styles.field} value={active.space} disabled={active.locked || active.system}
            onChange={(event) => onAction({ type: 'patch', id: active.id, patch: { space: event.target.value as CinematicSceneSet['space'] } })}>
            <option value="world">World · follows the camera</option><option value="viewport">Viewport · stays on screen</option>
          </select></label>
          <label>Timing<select aria-label="Timing" className={styles.field} disabled={active.locked}
            value={tracks.find((track) => track.target.type === 'group' && track.target.id === active.id)?.timing.mode === 'linked'
              ? (tracks.find((track) => track.target.type === 'group' && track.target.id === active.id)!.timing as { trackId: string }).trackId
              : active.timingTrackId ?? ''}
            onChange={(event) => onAction({ type: 'timing', id: active.id, trackId: event.target.value || undefined })}>
            <option value="">Always visible · unlink timing</option>
            {tracks.filter((track) => track.kind !== 'interaction').map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
          </select></label>
          <div className={styles.sceneSetActions}>
            <button type="button" disabled={active.locked} onClick={() => {
              const copyId = nextSceneSetId(`${active.id}-copy`, sets.map((set) => set.id));
              onAction({ type: 'duplicate', id: active.id, copyId }); onSelect(copyId);
            }}>Duplicate set</button>
            <button type="button" disabled={active.locked || active.system} onClick={() => { setDeleting(active.id); setMoveTo(''); }}>Delete set…</button>
          </div>
          {deleting === active.id && (
            <div className={styles.deleteMomentConfirm} role="alert">
              <strong>Delete “{active.label}”?</strong>
              <p>This affects {layers.filter((layer) => layer.group === active.id).length} layers in this view and their layout on both devices. Choose what happens to the layers.</p>
              <label>Layers<select aria-label="Layers" className={styles.field} value={moveTo} onChange={(event) => setMoveTo(event.target.value)}>
                <option value="">Delete with this set</option>
                {sets.filter((set) => set.id !== active.id && !set.locked).map((set) => <option key={set.id} value={set.id}>Move to {set.label}</option>)}
              </select></label>
              <div className={styles.sceneSetActions}>
                <button type="button" onClick={() => setDeleting(undefined)}>Cancel</button>
                <button type="button" onClick={() => {
                  onAction({ type: 'delete', id: active.id, moveTo: moveTo || undefined });
                  onSelect(moveTo || undefined); setDeleting(undefined);
                }}>Confirm delete scene set</button>
              </div>
            </div>
          )}
        </section>
      )}
      </div>
    </section>
  );
}
