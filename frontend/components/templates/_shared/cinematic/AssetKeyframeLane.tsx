'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { clampPoseValue, MAX_ASSET_KEYFRAMES, type AssetAnchor, type AssetAnchorOption, type AssetKeyframe, type AssetPose, type AssetPoseAppearance } from './assetKeyframes';
import { defaultTextGlitch } from './textEffects';
import AssetPerspectiveEditor, { type PerspectiveArtwork } from './AssetPerspectiveEditor';
import { ConfirmEditorAction } from './EditorActions';
import styles from './AssetKeyframeLane.module.css';

export interface AssetKeyframeLaneProps {
  label: string;
  breakpoint: string;
  at: number;
  points: AssetKeyframe[];
  selected?: AssetKeyframe;
  pose?: AssetPose;
  poseReady: boolean;
  appearance?: AssetPoseAppearance;
  textMotion?: { reveal: boolean; shadow: boolean };
  frameCount?: number;
  perspectiveArtwork?: PerspectiveArtwork;
  anchors?: AssetAnchorOption[];
  baseAnchorLabel: string;
  pending: boolean;
  legacyMotion?: boolean;
  onConvert?: () => void;
  onSeek: (at: number) => void;
  onPatch: (patch: Partial<AssetPose>) => void;
  onAnchor: (anchor?: AssetAnchor) => void;
  onCapture: () => void;
  onDiscard: () => void;
  onDone: () => void;
  onRetime: (id: string, at: number) => void;
  onEasing: (easing: AssetKeyframe['easing']) => void;
  onDelete: () => void;
  onCopyKeyframe?: () => void;
  onPasteKeyframe?: () => void;
  onDuplicate: () => void;
  onReset: () => void;
  onCopy?: () => void;
}

export default function AssetKeyframeLane({
  label, breakpoint, at, points, selected, pose, poseReady, appearance, textMotion, frameCount, perspectiveArtwork, anchors, baseAnchorLabel, pending, legacyMotion, onConvert,
  onSeek, onPatch, onAnchor, onCapture, onDiscard, onDone, onRetime, onEasing, onDelete, onCopyKeyframe, onPasteKeyframe, onDuplicate, onReset, onCopy,
}: AssetKeyframeLaneProps) {
  const opacity = pose?.opacity ?? appearance?.opacity ?? 1;
  const blur = pose?.blur ?? appearance?.blur ?? 0;
  const glitch = pose?.glitch;
  const otherBreakpoint = breakpoint === 'mobile' ? 'desktop' : 'mobile';
  const canCopyKeyframe = !pending && Boolean(onCopyKeyframe);
  const canInsertKeyframe = !pending && points.length < MAX_ASSET_KEYFRAMES;
  const canPasteKeyframe = canInsertKeyframe && !selected && Boolean(onPasteKeyframe);
  const ruler = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; at: number }>();
  const pointer = useRef<{ id: number; x: number; moved: boolean } | undefined>(undefined);
  const position = (event: PointerEvent) => {
    const rect = ruler.current?.getBoundingClientRect();
    return rect?.width ? clampPoseValue((event.clientX - rect.left) / rect.width) : at;
  };
  return <section className={styles.lane} aria-label={`${label} keyframes`} onKeyDown={(event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey ||
      (event.target as HTMLElement).closest('input:not([type="range"]), textarea, select, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key === 'c' && canCopyKeyframe) {
      event.preventDefault();
      onCopyKeyframe?.();
    }
    if (key === 'v' && canPasteKeyframe) {
      event.preventDefault();
      onPasteKeyframe?.();
    }
  }}>
    <div className={styles.toolbar}>
      <strong>{label}</strong>
      <span className={styles.breakpoint}>{breakpoint}</span>
      <button className={styles.capture} type="button" disabled={!poseReady} onClick={onCapture}>{selected ? 'Update keyframe' : 'Set keyframe'}</button>
      {pending && <><span role="status">Pending pose</span><button type="button" onClick={onDiscard}>Discard</button></>}
      <button className={styles.done} type="button" onClick={onDone} disabled={pending}>Done</button>
    </div>
    {legacyMotion && !pending && <div className={styles.toolbar}>
      {onConvert ? <button type="button" onClick={onConvert}>Convert existing motion</button>
        : <span>Setting a keyframe takes over this asset’s movement. Saved effects can still control any opacity or blur you leave unset.</span>}
    </div>}
    <div className={styles.ruler} ref={ruler}>
      <div className={styles.cursor} style={{ left: `${at * 100}%` }} />
      {points.map((point) => <button type="button" key={point.id} className={styles.point}
        disabled={pending} aria-pressed={selected?.id === point.id}
        aria-label={`Keyframe at ${(point.at * 100).toFixed(1)}%`}
        style={{ left: `${(drag?.id === point.id ? drag.at : point.at) * 100}%` }}
        onPointerDown={(event) => {
          if (event.button !== 0 || pointer.current) return;
          pointer.current = { id: event.pointerId, x: event.clientX, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const active = pointer.current;
          if (!active || active.id !== event.pointerId || (!active.moved && Math.abs(event.clientX - active.x) < 3)) return;
          active.moved = true;
          setDrag({ id: point.id, at: position(event) });
        }}
        onPointerUp={(event) => {
          const active = pointer.current;
          if (!active || active.id !== event.pointerId) return;
          pointer.current = undefined;
          setDrag(undefined);
          if (active.moved || Math.abs(event.clientX - active.x) >= 3) onRetime(point.id, position(event));
          else onSeek(point.at);
        }}
        onLostPointerCapture={(event) => {
          if (pointer.current?.id !== event.pointerId) return;
          pointer.current = undefined;
          setDrag(undefined);
        }}
        onClick={(event) => { if (event.detail === 0) onSeek(point.at); }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          onRetime(point.id, point.at + (event.key === 'ArrowLeft' ? -.01 : .01));
        }} />)}
    </div>
    <label className={styles.scrubber}>
      <span>Clip playhead</span>
      <input type="range" min="0" max="1" step=".0001" value={at} disabled={pending} onChange={(event) => onSeek(+event.target.value)} />
      <output>{(at * 100).toFixed(1)}%</output>
    </label>
    <div className={styles.toolbar}>
      {frameCount && pose?.frame !== undefined && <label>Artwork frame
        <input type="range" min="1" max={frameCount} step="1" disabled={!poseReady} value={Math.round(pose.frame * (frameCount - 1)) + 1}
          onChange={(event) => onPatch({ frame: (+event.target.value - 1) / (frameCount - 1) })} />
        <output>{Math.round(pose.frame * (frameCount - 1)) + 1} / {frameCount}</output>
      </label>}
      {pose?.paper !== undefined && <label>Paper reveal
        <input type="range" min="0" max="1" step=".01" disabled={!poseReady} value={pose.paper} onChange={(event) => onPatch({ paper: +event.target.value })} />
      </label>}
      {pose && (!!anchors?.length || pose.anchor) && <label>Anchor
        <select disabled={!poseReady} value={pose.anchor ?? ''} onChange={(event) => onAnchor(anchors?.find((anchor) => anchor.id === event.target.value)?.id)}>
          <option value="">{baseAnchorLabel}</option>
          {pose.anchor && !anchors?.some((anchor) => anchor.id === pose.anchor) &&
            <option value={pose.anchor} disabled>Anchor unavailable</option>}
          {anchors?.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>}
      {pose?.anchor?.startsWith('point:') && anchors?.some(({ id }) => id === pose.anchor) &&
        <button type="button" disabled={!poseReady} onClick={() => onPatch({ x: 0, y: 0 })}>Snap to anchor point</button>}
      {!!points.length && <label>Easing
        <select disabled={pending || !selected} value={selected?.easing ?? ''} onChange={(event) => onEasing(event.target.value as AssetKeyframe['easing'])}>
          <option value="">Select a keyframe</option><option value="linear">Linear</option><option value="ease-in">Ease in</option><option value="ease-out">Ease out</option>
          <option value="ease-in-out">Ease in and out</option><option value="hold">Hold</option>
        </select>
      </label>}
      {(!!points.length || onPasteKeyframe) && <>
        <button type="button" disabled={!canCopyKeyframe} onClick={onCopyKeyframe}>Copy keyframe</button>
        <button type="button" disabled={!canPasteKeyframe} onClick={onPasteKeyframe}>Paste at playhead</button>
      </>}
      {!!points.length && <><button type="button" disabled={!canInsertKeyframe || !selected} onClick={onDuplicate}>Duplicate</button>
        <button type="button" disabled={pending || !selected} onClick={onDelete}>Delete keyframe</button></>}
      {!!points.length && !pending && <details><summary>Track actions</summary>
        <div className={styles.numeric}>
          <ConfirmEditorAction label="Reset animation" description="Restore the template animation for this asset." onConfirm={onReset} />
          {onCopy && <ConfirmEditorAction label={`Copy to ${otherBreakpoint}`} description={`Replace the asset’s keyframes on ${otherBreakpoint} with this track.`} onConfirm={onCopy} />}
        </div>
      </details>}
      {pose && textMotion && <details className={styles.textMotion}><summary>Text effects</summary>
        {textMotion.reveal && <>
          <label>Reveal by
            <select value={pose.textReveal ?? ''} disabled={!poseReady} onChange={(event) => {
              const mode = event.target.value;
              onPatch(mode === 'letters' || mode === 'words'
                ? { textReveal: mode, revealAmount: pose.revealAmount ?? 0 }
                : { textReveal: undefined, revealAmount: 1 });
            }}>
              <option value="">Show all</option><option value="letters">Letter</option><option value="words">Word</option>
            </select>
          </label>
          {pose.textReveal && <label>Text revealed
            <input type="range" min="0" max="1" step=".01" disabled={!poseReady} value={pose.revealAmount ?? 1}
              onChange={(event) => onPatch({ revealAmount: event.target.valueAsNumber })} />
            <output>{Math.round((pose.revealAmount ?? 1) * 100)}%</output>
          </label>}
        </>}
        {textMotion.shadow && <label>Shadow opacity
          <input type="range" min="0" max="1" step=".01" disabled={!poseReady}
            value={pose.shadowOpacity ?? appearance?.shadowOpacity ?? 0} onChange={(event) => onPatch({ shadowOpacity: event.target.valueAsNumber })} />
          <output>{Math.round((pose.shadowOpacity ?? appearance?.shadowOpacity ?? 0) * 100)}%</output>
        </label>}
        <div className={styles.toolbar}>
          <button type="button" disabled={!poseReady} onClick={() => onPatch({ blur: 8 })}>Blurred</button>
          <button type="button" disabled={!poseReady} onClick={() => onPatch({ blur: 0 })}>In focus</button>
        </div>
        <label>Glitch burst
          <input type="checkbox" disabled={!poseReady} checked={!!glitch?.intensity}
            onChange={(event) => onPatch({ glitch: event.target.checked ? defaultTextGlitch : undefined })} />
        </label>
        {!!glitch?.intensity && <>
          <span>The burst starts at this keyframe and fades over its duration.</span>
          {([['intensity', 'Glitch intensity', .01], ['split', 'Colour split', 0], ['duration', 'Duration (% of clip)', .01]] as const).map(([key, label, min]) =>
            <label key={key}>{label}
              <input type="range" min={min} max="1" step=".01" disabled={!poseReady} value={glitch[key]}
                onChange={(event) => onPatch({ glitch: { ...glitch, [key]: event.target.valueAsNumber } })} />
              <output>{Math.round(glitch[key] * 100)}%</output>
            </label>)}
        </>}
      </details>}
      {pose && perspectiveArtwork && <AssetPerspectiveEditor pose={pose} artwork={perspectiveArtwork} disabled={!poseReady} onPatch={onPatch} />}
      {pose && <details><summary>Opacity & blur</summary>
        <div className={styles.numeric}>
          <label>Opacity<input type="range" min="0" max="1" step=".01" disabled={!poseReady}
            value={opacity} onChange={(event) => onPatch({ opacity: +event.target.value })} />
            <output>{Math.round(opacity * 100)}%</output></label>
          <label>Blur<input type="range" min="0" max="40" step=".5" disabled={!poseReady}
            value={blur} onChange={(event) => onPatch({ blur: +event.target.value })} />
            <output>{blur.toFixed(1)} px</output></label>
        </div>
      </details>}
      {pose && <details><summary>Transform values</summary>
        <div className={styles.numeric}>
          {([['x', 'X offset', .1], ['y', 'Y offset', .1], ['scale', 'Scale', .01], ['rotate', 'Rotation', 1]] as const).map(([key, name, step]) =>
            <label key={key}>{name}<input type="number" step={step} disabled={!poseReady} value={Number(pose[key].toFixed(3))}
              onChange={(event) => {
                if (Number.isFinite(event.target.valueAsNumber)) onPatch({ [key]: event.target.valueAsNumber });
              }} /></label>)}
        </div>
      </details>}
    </div>
  </section>;
}
