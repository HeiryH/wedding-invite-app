'use client';

import { useId, useState } from 'react';
import type { Breakpoint } from '../types';
import type { CinematicWorldLayer } from './world';
import type { CinematicSceneSet } from './sceneSets';
import type { CinematicSequenceBeat, CinematicSequenceTrack } from './sequence';
import { MOTION_DEFAULT, normalizeEffect, normalizeInteraction, type CinematicDirection, type CinematicEffect, type CinematicInteraction, type CinematicMotion } from './direction';
import { nextSceneSetId } from './sceneSetEditing';
import { CURATED_FONTS } from '@/lib/fonts/registry';
import { EditorActions, ConfirmEditorAction } from './EditorActions';
import { useWorkspacePreference, decodeDirectorTab } from './workspacePreferences';
import styles from './CinematicAdjustPanel.module.css';

function NumberField({ label, value, onChange, min = 0, max = 3000, step = 1 }: {
  label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number;
}) {
  return <label>{label}<input type="number" value={value} min={min} max={max} step={step}
    onChange={(event) => { if (event.target.value !== '') onChange(Number(event.target.value)); }} /></label>;
}

export default function DirectorSettings({ value, onChange, breakpoint, layers, sets, beats, tracks, onPreview, onAddEffectTrack, standalone = false,
  effectScope, pose, onEditPose, selectedEffectTrackId }: {
  selectedEffectTrackId?: string;
  /** A layer id for its inspector, or __world for the Advanced panel. */
  effectScope?: string;
  pose?: { effectId: string; side: 'from' | 'to' };
  onEditPose?: (pose?: { effectId: string; side: 'from' | 'to' }) => void;
  standalone?: boolean;
  value: CinematicDirection; onChange: (value: CinematicDirection) => void; breakpoint: Breakpoint;
  layers: CinematicWorldLayer[]; sets: CinematicSceneSet[]; beats: CinematicSequenceBeat[]; tracks: CinematicSequenceTrack[];
  onPreview: (trackId: string) => void; onAddEffectTrack: (id: string, label: string) => void;
}) {
  const [tab, setTab] = useWorkspacePreference('einvite.cinematic.advanced-tab.v1', 'effects', decodeDirectorTab);
  const tabsId = useId();
  const tabs = ['effects', 'interactions', 'pacing', 'navigation', 'memories', 'theme'];
  const [effectId, setEffectId] = useState(value.effects.find((item) => item.trackId === selectedEffectTrackId)?.id ?? value.effects[0]?.id ?? '');
  const [interactionId, setInteractionId] = useState(value.interactions[0]?.id ?? '');
  const scopedEffects = value.effects.filter((item) => !effectScope || (effectScope === '__world'
    ? item.target === 'world' || item.targetId.includes(':') : item.target === 'layer' && item.targetId === effectScope));
  const selectedEffect = scopedEffects.find((effect) => effect.id === effectId) ?? scopedEffects[0];
  const layerScope = Boolean(effectScope && effectScope !== '__world');
  const effect = selectedEffect && breakpoint === 'desktop' ? { ...selectedEffect, ...selectedEffect.desktop } : selectedEffect;
  const selectedInteraction = value.interactions.find((record) => record.id === interactionId);
  const changeEffect = (patch: Partial<CinematicEffect>) => {
    if (patch.enabled === false || patch.trackId !== undefined) onEditPose?.();
    onChange({ ...value, effects: value.effects.map((candidate) => {
    if (candidate.id !== selectedEffect?.id) return candidate;
    return breakpoint === 'desktop' ? { ...candidate, desktop: { ...candidate.desktop, ...patch } } : { ...candidate, ...patch };
  }) });
  };
  const changeInteraction = (patch: Partial<CinematicInteraction>) => onChange({ ...value, interactions: value.interactions.map((record) => record.id === interactionId ? { ...record, ...patch } : record) });
  const trackOptions = tracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>);
  const layerOptions = layers.map((layer) => <option key={layer.id} value={layer.id}>{layer.label}</option>);
  const beatOptions = beats.map((beat) => <option key={beat.id} value={beat.id}>{beat.label}</option>);
  const setCheckboxes = (field: 'returnSetIds' | 'revealSetIds') => <div className={styles.directorChecks}>{sets.map((set) => <label key={set.id}>
    <input type="checkbox" checked={selectedInteraction?.[field].includes(set.id) ?? false} onChange={(event) => changeInteraction({
      [field]: event.target.checked ? [...selectedInteraction![field], set.id] : selectedInteraction![field].filter((id) => id !== set.id),
    })} />{set.label}</label>)}</div>;
  const Container = standalone ? 'section' : 'details';
  return <Container className={`${styles.directorSettings} ${standalone ? styles.directorStandalone : ''}`}>
    {layerScope ? <><h3>Movement & effects</h3><p className={styles.note}>Each effect has its own timeline track. From and To are offsets from this layer’s Layout position.</p></> : standalone ? <><h3>Story settings</h3><p className={styles.note}>World effects and overall story settings. Edit layer movements in the layer’s Animation tab.</p></> : <summary>Story settings</summary>}
    {!layerScope && <div role="tablist" aria-label="Story settings" className={styles.directorTabs}>
      {tabs.map((id, index) => <button key={id} type="button" role="tab"
        id={`${tabsId}-${id}`} aria-controls={`${tabsId}-panel`} tabIndex={tab === id ? 0 : -1}
        aria-selected={tab === id} onClick={() => setTab(id)} onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1]
            : tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          setTab(next); document.getElementById(`${tabsId}-${next}`)?.focus();
        }}>{id[0].toUpperCase() + id.slice(1)}</button>)}
    </div>}
    <section role={layerScope ? undefined : 'tabpanel'} id={`${tabsId}-panel`} aria-labelledby={layerScope ? undefined : `${tabsId}-${tab}`} className={styles.directorFields}>
      {(layerScope || tab === 'effects') && <>
        <label>Effect<select aria-label="Effect" value={selectedEffect?.id ?? ''} onChange={(event) => { onEditPose?.(); setEffectId(event.target.value); }}>
          <option value="">Select effect</option>{scopedEffects.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></label>
        <button type="button" onClick={() => {
          const id = nextSceneSetId('effect', [...value.effects.map((item) => item.id), ...tracks.map((item) => item.id)]);
          const item = normalizeEffect({ id, label: layerScope ? `${layers.find((layer) => layer.id === effectScope)?.label ?? 'Layer'} movement` : 'New effect', trackId: id,
            target: effectScope === '__world' ? 'world' : 'layer', targetId: layerScope ? effectScope : layers[0]?.id, from: MOTION_DEFAULT, to: MOTION_DEFAULT })!;
          onChange({ ...value, effects: [...value.effects, item] }); onAddEffectTrack(id, item.label); setEffectId(id);
        }}>{layerScope ? 'Add layer effect' : 'Add effect'}</button>
        {effect && <>
          {!tracks.some((track) => track.id === effect.trackId) && <p role="status">This effect’s timing track is missing. Choose a track to enable its movement.</p>}
          {effect.target === 'layer' && !layers.some((layer) => layer.id === effect.targetId.split(':')[0] && !layer.hidden) && <p role="status">The target layer is missing or hidden.</p>}
          <p>{breakpoint === 'desktop' ? 'Editing desktop movement. Use shared movement to remove this override.' : 'Editing shared movement. Desktop can override it.'}</p>
          <label>Name<input value={effect.label} onChange={(event) => changeEffect({ label: event.target.value })} /></label>
          <label className={styles.directorCheck}><input type="checkbox" checked={effect.enabled} onChange={(event) => changeEffect({ enabled: event.target.checked })} />Enabled</label>
          <label>Effect type<select aria-label="Effect type" value={effect.kind} onChange={(event) => changeEffect({ kind: event.target.value as CinematicEffect['kind'] })}>
            <option value="transform">Movement</option><option value="drift">Drift and oscillation</option><option value="blur">Blur</option>
          </select></label>
          <label>Timing track<select aria-label="Effect timing track" value={effect.trackId} onChange={(event) => changeEffect({ trackId: event.target.value })}>{trackOptions}</select></label>
          {!effectScope && <label>Apply to<select aria-label="Effect target" value={effect.target === 'world' ? '__world' : effect.targetId} onChange={(event) => changeEffect({
            target: event.target.value === '__world' ? 'world' : 'layer', targetId: event.target.value === '__world' ? '' : event.target.value,
          })}><option value="__world">Entire world</option>{layerOptions}{layers.filter((layer) => layer.behavior === 'rsvp-envelope').map((layer) => <option key={`${layer.id}:content`} value={`${layer.id}:content`}>{layer.label} · paper</option>)}</select></label>}
          <label>Easing<select aria-label="Effect easing" value={effect.easing} onChange={(event) => changeEffect({ easing: event.target.value as CinematicEffect['easing'] })}>
            {['linear', 'ease-in', 'ease-out', 'ease-in-out'].map((id) => <option key={id}>{id}</option>)}
          </select></label>
          {layerScope && onEditPose && <>
            <div className={styles.sceneSetActions}>
              {(['from', 'to'] as const).map((side) => <button key={side} type="button" disabled={!effect.enabled || !tracks.some((track) => track.id === effect.trackId)}
                aria-pressed={pose?.effectId === effect.id && pose.side === side}
                onClick={() => onEditPose({ effectId: effect.id, side })}>Edit {side === 'from' ? 'From' : 'To'} on canvas</button>)}
            </div>
            {pose?.effectId === effect.id && <div role="status" className={styles.timingEditor}>
              <strong>Editing {pose.side === 'from' ? 'From' : 'To'} pose</strong>
              <p className={styles.note}>Drag the artwork to move this pose. Drag its corner to scale it. Layout stays unchanged. Use the numbers below for rotation and other properties.</p>
              <button type="button" onClick={() => onEditPose()}>Done editing pose</button>
            </div>}
          </>}
          <div className={styles.motionGrid}><strong>Property</strong><strong>From</strong><strong>To</strong>
            {(Object.keys(MOTION_DEFAULT) as (keyof CinematicMotion)[]).map((key) => <div key={key} className={styles.motionRow}>
              <span>{({ x: 'X (% of layer)', y: 'Y (% of layer)', xVw: 'X (% of screen)', yVh: 'Y (% of screen)', scale: 'Scale', rotate: 'Rotation', opacity: 'Opacity', blur: 'Blur (px)' })[key]}</span>
              {(['from', 'to'] as const).map((side) => <input key={side} type="number" aria-label={`${key} ${side}`} step={key === 'scale' || key === 'opacity' ? .05 : .5}
                value={effect[side][key]} onChange={(event) => changeEffect({ [side]: { ...effect[side], [key]: Number(event.target.value) } })} />)}
            </div>)}
          </div>
          {effect.kind === 'drift' && <><NumberField label="Drift X" value={effect.amplitudeX} min={-100} max={100} step={.1} onChange={(amplitudeX) => changeEffect({ amplitudeX })} />
            <NumberField label="Drift Y" value={effect.amplitudeY} min={-100} max={100} step={.1} onChange={(amplitudeY) => changeEffect({ amplitudeY })} />
            <NumberField label="Oscillation cycles" value={effect.frequency} max={20} step={.1} onChange={(frequency) => changeEffect({ frequency })} /></>}
          <div className={styles.sceneSetActions}>
            <button type="button" onClick={() => { onEditPose?.(); onPreview(effect.trackId); }}>Preview effect</button>
            {breakpoint === 'desktop' && <button type="button" onClick={() => onChange({ ...value, effects: value.effects.map((item) => item.id === effect.id ? { ...item, desktop: undefined } : item) })}>Use shared movement</button>}
            <EditorActions key={effect.id} label="Effect actions"><ConfirmEditorAction label="Delete effect"
              description={`Remove only “${effect.label}”. Its target artwork and other effects remain.`}
              onConfirm={() => { onEditPose?.(); onChange({ ...value, effects: value.effects.filter((item) => item.id !== effect.id) }); setEffectId(''); }} /></EditorActions>
          </div>
        </>}
      </>}
      {!layerScope && tab === 'interactions' && <>
        <label>Interaction<select aria-label="Interaction" value={interactionId} onChange={(event) => setInteractionId(event.target.value)}>
          <option value="">Select interaction</option>{value.interactions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></label>
        <button type="button" onClick={() => {
          const id = nextSceneSetId('interaction', value.interactions.map((item) => item.id));
          onChange({ ...value, interactions: [...value.interactions, normalizeInteraction({ id, label: 'New interaction', triggerLayerId: layers[0]?.id })!] }); setInteractionId(id);
        }}>Add interaction</button>
        {selectedInteraction && <>
          {!layers.some((layer) => layer.id === selectedInteraction.triggerLayerId && !layer.hidden) && <p role="status">The trigger layer is missing or hidden. Choose a visible layer.</p>}
          {selectedInteraction.availabilityTrackId && !tracks.some((track) => track.id === selectedInteraction.availabilityTrackId) && <p role="status">The availability track was removed; this action is unavailable until you choose another track.</p>}
          {['focus', 'navigate'].includes(selectedInteraction.action) && !beats.some((beat) => beat.id === selectedInteraction.targetBeatId) && <p role="status">The destination beat is missing. Choose another beat.</p>}
          <label>Name<input value={selectedInteraction.label} onChange={(event) => changeInteraction({ label: event.target.value })} /></label>
          <label className={styles.directorCheck}><input type="checkbox" checked={selectedInteraction.enabled} onChange={(event) => changeInteraction({ enabled: event.target.checked })} />Enabled</label>
          <label>Trigger layer<select aria-label="Trigger layer" value={selectedInteraction.triggerLayerId} onChange={(event) => {
            const duplicate = value.interactions.find((record) => record.id !== interactionId && record.triggerLayerId === event.target.value && record.enabled);
            if (duplicate) { window.alert(`This layer already triggers ${duplicate.label}. Choose another layer or disable that interaction first.`); return; }
            changeInteraction({ triggerLayerId: event.target.value });
          }}><option value="">Choose layer</option>{layerOptions}</select></label>
          <label>Action<select aria-label="Interaction action" value={selectedInteraction.action} onChange={(event) => changeInteraction({ action: event.target.value as CinematicInteraction['action'] })}>
            <option value="rsvp">Open RSVP form</option><option value="wish">Open Wishes form</option><option value="programme">Open programme board</option><option value="info">Open information sheet</option>
            <option value="focus">Focus camera</option><option value="navigate">Go to beat</option><option value="return">Return to previous camera</option>
          </select></label>
          <label>Availability<select aria-label="Interaction availability" value={selectedInteraction.availabilityTrackId} onChange={(event) => changeInteraction({ availabilityTrackId: event.target.value })}>
            <option value="">Always</option>{trackOptions}</select></label>
          <label>Reset when scrolling before<select aria-label="Interaction reset" value={selectedInteraction.resetTrackId} onChange={(event) => changeInteraction({ resetTrackId: event.target.value })}>
            <option value="">Never reset</option>{trackOptions}</select></label>
          {(selectedInteraction.action === 'focus' || selectedInteraction.action === 'navigate') && <label>Target beat<select aria-label="Interaction target beat" value={selectedInteraction.targetBeatId} onChange={(event) => changeInteraction({ targetBeatId: event.target.value })}><option value="">Choose beat</option>{beatOptions}</select></label>}
          <label>After closing<select aria-label="Interaction return" value={selectedInteraction.returnMode} onChange={(event) => changeInteraction({ returnMode: event.target.value as CinematicInteraction['returnMode'] })}>
            <option value="scene">Return to scene and wait for scroll</option><option value="previous">Return to previous position</option><option value="stay">Keep object visible</option>
          </select></label>
          <label className={styles.directorCheck}><input type="checkbox" checked={selectedInteraction.lockScroll} onChange={(event) => changeInteraction({ lockScroll: event.target.checked })} />Pause scrolling while open</label>
          <div className={styles.twoColumn}><NumberField label="Open animation (ms)" value={selectedInteraction.openMs} max={5000} onChange={(openMs) => changeInteraction({ openMs })} />
            <NumberField label="Close animation (ms)" value={selectedInteraction.closeMs} max={5000} onChange={(closeMs) => changeInteraction({ closeMs })} /></div>
          <details><summary>Sets to restore</summary>{setCheckboxes('returnSetIds')}</details>
          <details><summary>Sets to reveal after closing</summary>{setCheckboxes('revealSetIds')}</details>
          {selectedInteraction.action === 'info' && <><label>Sheet title<input value={selectedInteraction.infoTitle} onChange={(event) => changeInteraction({ infoTitle: event.target.value })} /></label>
            <label>Sheet body<textarea value={selectedInteraction.infoBody} onChange={(event) => changeInteraction({ infoBody: event.target.value })} /></label></>}
          <EditorActions key={interactionId} label="Interaction actions"><ConfirmEditorAction label="Delete interaction"
            description={`Remove only “${selectedInteraction.label}”. Guests lose this interaction entry point; forms and other interactions remain.`}
            onConfirm={() => { onChange({ ...value, interactions: value.interactions.filter((item) => item.id !== interactionId) }); setInteractionId(''); }} /></EditorActions>
        </>}
      </>}
      {!layerScope && tab === 'pacing' && <>
        <p>Scroll distance is measured in screen heights (100 = one screen). A hold keeps the camera still while the guest continues scrolling.</p>
        <NumberField label="Mobile story distance" value={value.pacing.mobileVh} min={300} max={30000} onChange={(mobileVh) => onChange({ ...value, pacing: { ...value.pacing, mobileVh } })} />
        <NumberField label="Desktop story distance" value={value.pacing.desktopVh} min={300} max={30000} onChange={(desktopVh) => onChange({ ...value, pacing: { ...value.pacing, desktopVh } })} />
        {beats.map((beat) => <details key={beat.id}><summary>{beat.label}</summary><div className={styles.directorFields}>
          {(['mobileVh', 'desktopVh', 'holdVh'] as const).map((field) => <label key={field}>{field === 'holdVh' ? 'Hold distance' : field === 'mobileVh' ? 'Mobile incoming distance' : 'Desktop incoming distance'}
            <input type="number" min={field === 'holdVh' ? 0 : 1} max={3000} placeholder="Automatic" value={value.pacing.beats[beat.id]?.[field] ?? ''}
              onChange={(event) => onChange({ ...value, pacing: { ...value.pacing, beats: { ...value.pacing.beats,
                [beat.id]: { ...value.pacing.beats[beat.id], [field]: event.target.value === '' ? undefined : Number(event.target.value) },
              } } })} /></label>)}
        </div></details>)}
      </>}
      {!layerScope && tab === 'navigation' && <>
        <p>Anchors connect the invitation navigation to your edited story.</p>
        {value.navigation.map((anchor, index) => <details key={anchor.id}><summary>{anchor.label}</summary><div className={styles.directorFields}>
          <label>Label<input value={anchor.label} onChange={(event) => onChange({ ...value, navigation: value.navigation.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} /></label>
          <label>Anchor ID<input defaultValue={anchor.id} onBlur={(event) => {
            const id = event.target.value;
            if (/^[a-zA-Z][\w-]{0,79}$/.test(id) && !value.navigation.some((item, i) => item.id === id && i !== index)) onChange({ ...value, navigation: value.navigation.map((item, i) => i === index ? { ...item, id } : item) });
            else event.target.value = anchor.id;
          }} /></label>
          <label>Position type<select aria-label={`Anchor type ${anchor.label}`} value={anchor.target} onChange={(event) => onChange({ ...value, navigation: value.navigation.map((item, i) => i === index ? { ...item, target: event.target.value as typeof item.target } : item) })}>
            <option value="beat">At beat</option><option value="track-start">Track start</option><option value="track-enter">Track fully visible</option><option value="track-end">Track end</option>
          </select></label>
          <label>Destination<select aria-label={`Anchor destination ${anchor.label}`} value={anchor.targetId} onChange={(event) => onChange({ ...value, navigation: value.navigation.map((item, i) => i === index ? { ...item, targetId: event.target.value } : item) })}>
            <option value="">Choose destination</option>{anchor.target === 'beat' ? beatOptions : trackOptions}</select></label>
          <div className={styles.sceneSetActions}>{[-1, 1].map((offset) => <button key={offset} type="button" disabled={index + offset < 0 || index + offset >= value.navigation.length} onClick={() => {
            const navigation = [...value.navigation]; [navigation[index], navigation[index + offset]] = [navigation[index + offset], navigation[index]]; onChange({ ...value, navigation });
          }}>{offset < 0 ? 'Move up' : 'Move down'}</button>)}
            <button type="button" onClick={() => onChange({ ...value, navigation: value.navigation.filter((_, i) => i !== index) })}>Remove anchor</button></div>
        </div></details>)}
        <button type="button" onClick={() => onChange({ ...value, navigation: [...value.navigation, { id: nextSceneSetId('anchor', value.navigation.map((item) => item.id)), label: 'New destination', target: 'beat', targetId: beats[0]?.id ?? '' }] })}>Add navigation anchor</button>
      </>}
      {!layerScope && tab === 'memories' && <>
        {(['frames', 'maxPhotos', 'columns', 'gap', 'tilt', 'borderWidth', 'captionX', 'captionY', 'captionWidth'] as const).map((key) => <NumberField key={key}
          label={({ frames: 'Frame count', maxPhotos: 'Maximum approved photos', columns: 'Columns', gap: 'Frame gap (%)', tilt: 'Frame tilt (°)', borderWidth: 'Border width (px)', captionX: 'Caption X (%)', captionY: 'Caption bottom (%)', captionWidth: 'Caption width (%)' })[key]}
          value={value.theme.memory[key]} min={key === 'tilt' ? -30 : 0} max={key === 'frames' ? 24 : key === 'columns' ? 6 : 100} step={key === 'tilt' ? .1 : 1}
          onChange={(number) => onChange({ ...value, theme: { ...value.theme, memory: { ...value.theme.memory, [key]: number } } })} />)}
        <label>Frame colour<input type="color" value={value.theme.memory.frameColor} onChange={(event) => onChange({ ...value, theme: { ...value.theme, memory: { ...value.theme.memory, frameColor: event.target.value } } })} /></label>
        <label>Empty frame text<input value={value.theme.memory.placeholder} onChange={(event) => onChange({ ...value, theme: { ...value.theme, memory: { ...value.theme.memory, placeholder: event.target.value } } })} /></label>
      </>}
      {!layerScope && tab === 'theme' && <>
        {(['ink', 'secondaryInk', 'accent', 'panel', 'border', 'page'] as const).map((key) => <label key={key}>{({ ink: 'Primary ink', secondaryInk: 'Secondary ink', accent: 'Accent', panel: 'Panels and paper', border: 'Rules and borders', page: 'Backdrop base' })[key]}
          <input type="color" value={value.theme[key]} onChange={(event) => onChange({ ...value, theme: { ...value.theme, [key]: event.target.value } })} /></label>)}
        {(['displayFont', 'bodyFont'] as const).map((key) => <label key={key}>{key === 'displayFont' ? 'Display font' : 'Body font'}<select aria-label={key} value={value.theme[key]} onChange={(event) => onChange({ ...value, theme: { ...value.theme, [key]: event.target.value } })}>
          <option value="">Template font</option>{CURATED_FONTS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}</select></label>)}
        {(['radius', 'shadow', 'titleSize', 'bodySize'] as const).map((key) => <NumberField key={key} label={({ radius: 'Corner radius', shadow: 'Shadow opacity', titleSize: 'Narrative title size', bodySize: 'Narrative body size' })[key]}
          value={value.theme[key]} max={key === 'shadow' ? 1 : 100} step={key === 'shadow' ? .05 : .1} onChange={(number) => onChange({ ...value, theme: { ...value.theme, [key]: number } })} />)}
      </>}
    </section>
  </Container>;
}
