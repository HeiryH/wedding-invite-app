'use client';

import { useRef, type CSSProperties, type PointerEvent } from 'react';
import type { AssetPose } from './assetKeyframes';
import { flatSurface, normalizeAssetPerspective, surfaceCornerNames, tableSurface, type SurfacePoint } from './assetPerspective';
import { useAssetSurface } from './useAssetSurface';
import styles from './AssetKeyframeLane.module.css';

export interface PerspectiveArtwork {
  src?: string;
  sprite?: CSSProperties;
}

function Artwork({ pose, artwork }: { pose: AssetPose; artwork: PerspectiveArtwork }) {
  const { ref: surfaceRef, style: surfaceStyle } = useAssetSurface<HTMLDivElement>(pose);
  return <div className={styles.pinArtwork} ref={surfaceRef}
    style={{ ...artwork.sprite, backgroundImage: artwork.src ? `url("${artwork.src.replaceAll('"', '%22')}")` : artwork.sprite?.backgroundImage,
      ...surfaceStyle }} />;
}

export default function AssetPerspectiveEditor({ pose, artwork, disabled, onPatch }: {
  pose: AssetPose; artwork: PerspectiveArtwork; disabled: boolean; onPatch: (patch: Partial<AssetPose>) => void;
}) {
  const corners = pose.perspective ?? flatSurface;
  const pad = useRef<HTMLDivElement>(null);
  const changePin = (index: number, point: SurfacePoint) => {
    const perspective = normalizeAssetPerspective(corners.map((corner, i) => i === index ? point : corner));
    if (perspective) onPatch({ perspective });
  };
  const move = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    const rect = pad.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    changePin(index, { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height });
  };
  return <details className={styles.perspectiveTools}>
    <summary>Perspective & shadow</summary>
    <div className={styles.toolbar}>
      <button type="button" disabled={disabled} onClick={() => onPatch({ perspective: tableSurface })}>Table tilt</button>
      <button type="button" disabled={disabled} onClick={() => onPatch({ perspective: undefined })}>Reset perspective</button>
    </div>
    <p>Drag a corner to tilt the artwork. Set or update a keyframe to keep the pose.</p>
    <div className={styles.pinPad} ref={pad} style={{ aspectRatio: artwork.sprite?.aspectRatio }}>
      <Artwork pose={pose} artwork={artwork} />
      <svg className={styles.pinOutline} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={corners.map(({ x, y }) => `${x * 100},${y * 100}`).join(' ')} vectorEffect="non-scaling-stroke" />
      </svg>
      {corners.map((point, i) => <button type="button" key={surfaceCornerNames[i]} disabled={disabled}
        className={styles.pinHandle} aria-label={`${surfaceCornerNames[i]} perspective pin`}
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        onPointerDown={(event) => { if (event.button === 0) event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => move(event, i)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? .05 : .01;
          let { x, y } = point;
          if (event.key === 'ArrowLeft') x -= step;
          else if (event.key === 'ArrowRight') x += step;
          else if (event.key === 'ArrowUp') y -= step;
          else if (event.key === 'ArrowDown') y += step;
          else return;
          event.preventDefault();
          changePin(i, { x, y });
        }} />)}
    </div>
    <label>Contact shadow
      <input type="range" min="0" max="1" step=".01" value={pose.contactShadow ?? 0} disabled={disabled}
        onChange={(event) => onPatch({ contactShadow: event.target.valueAsNumber })} />
      <output>{Math.round((pose.contactShadow ?? 0) * 100)}%</output>
    </label>
    {Boolean(pose.contactShadow) && <label>Shadow softness
      <input type="range" min="0" max="16" step="1" value={pose.shadowSoftness ?? 4} disabled={disabled}
        onChange={(event) => onPatch({ shadowSoftness: event.target.valueAsNumber })} />
      <output>{pose.shadowSoftness ?? 4} px</output>
    </label>}
  </details>;
}
