'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { clampPoseValue, type CinematicAnchorPoint } from './assetKeyframes';
import type { CinematicWorldLayer } from './world';
import styles from './CinematicAdjustPanel.module.css';

export default function AnchorPointEditor({ layer, disabled, onChange }: {
  layer: CinematicWorldLayer;
  disabled?: boolean;
  onChange: (points: CinematicAnchorPoint[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLButtonElement>(null);
  const zoomCenter = useRef<{ x: number; y: number }>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const points = layer.anchorPoints ?? [];
  const [selectedId, setSelectedId] = useState<string>();
  const [aspectRatio, setAspectRatio] = useState(0);
  const selected = points.find((point) => point.id === selectedId) ?? points[0];
  const canAdd = aspectRatio > 0 && points.length < 24 && !disabled;
  const add = (x = .5, y = .5) => {
    if (!canAdd) return;
    const id = crypto.randomUUID();
    onChange([...points, { id, label: points.length ? `Anchor point ${points.length + 1}` : 'Anchor point',
      x, y, aspectRatio }]);
    setSelectedId(id);
  };
  const patch = (change: Partial<CinematicAnchorPoint>) => {
    if (!selected || disabled) return;
    onChange(points.map((point) => point.id === selected.id ? { ...point, ...change } : point));
  };

  const aspect = aspectRatio > 0 ? aspectRatio : 1;
  const fitWidth = Math.max(1, Math.min(canvasSize.width - 40, (canvasSize.height - 40) * aspect));
  useLayoutEffect(() => {
    if (!open || !viewportRef.current) return;
    const viewport = viewportRef.current;
    const measure = () => setCanvasSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [open]);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const image = canvasRef.current;
    const center = zoomCenter.current;
    if (!viewport || !image || !center) return;
    zoomCenter.current = null;
    const art = image.getBoundingClientRect();
    const area = viewport.getBoundingClientRect();
    viewport.scrollLeft += art.left + art.width * center.x - area.left - viewport.clientWidth / 2;
    viewport.scrollTop += art.top + art.height * center.y - area.top - viewport.clientHeight / 2;
  }, [zoom]);
  useEffect(() => {
    if (disabled && open) dialogRef.current?.close();
  }, [disabled, open]);

  const changeZoom = (value: number) => {
    const next = clampPoseValue(value, 1, 8);
    const image = canvasRef.current?.getBoundingClientRect();
    const area = viewportRef.current?.getBoundingClientRect();
    if (next === zoom || !image?.width || !image.height || !area) return;
    zoomCenter.current = zoom === 1 && selected ? selected : {
      x: clampPoseValue((area.left + area.width / 2 - image.left) / image.width),
      y: clampPoseValue((area.top + area.height / 2 - image.top) / image.height),
    };
    setZoom(next);
  };

  return (
    <div className={styles.anchorPoints}>
      <button type="button" className={styles.timingLinkButton} disabled={disabled} aria-haspopup="dialog" onClick={() => {
        dialogRef.current?.showModal();
        setOpen(true);
      }}>Edit anchor points</button>
      <dialog ref={dialogRef} className={styles.anchorPointDialog} aria-labelledby={titleId} onClose={() => {
        setOpen(false);
        setZoom(1);
        setAspectRatio(0);
      }}>
        {open && <>
          <header className={styles.anchorPointHeader}>
            <div><h2 id={titleId}>Anchor points</h2><p>{layer.label}</p></div>
            <button type="button" onClick={() => dialogRef.current?.close()}>Done</button>
          </header>
          <div className={styles.anchorPointWorkspace}>
            <div className={styles.anchorPointArt}>
              <div className={styles.anchorPointZoom} role="group" aria-label="Artwork zoom">
                <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => changeZoom(zoom / Math.SQRT2)}>−</button>
                <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
                <button type="button" aria-label="Zoom in" disabled={zoom >= 8} onClick={() => changeZoom(zoom * Math.SQRT2)}>+</button>
                <button type="button" disabled={zoom === 1} onClick={() => changeZoom(1)}>Fit</button>
              </div>
              <div className={styles.anchorPointViewport} ref={viewportRef} role="region" aria-label="Anchor artwork canvas" tabIndex={0}>
                <div className={styles.anchorPointBoard}>
                  <button type="button" ref={canvasRef} className={styles.anchorPointCanvas}
                    style={{ width: fitWidth * zoom }} disabled={disabled || aspectRatio <= 0 || (!selected && !canAdd)}
                    aria-label="Place anchor point on artwork" onClick={(event) => {
                      if (!event.detail) {
                        if (!selected) add();
                        return;
                      }
                      const bounds = event.currentTarget.getBoundingClientRect();
                      if (!bounds.width || !bounds.height) return;
                      const x = clampPoseValue((event.clientX - bounds.left) / bounds.width);
                      const y = clampPoseValue((event.clientY - bounds.top) / bounds.height);
                      if (selected) patch({ x, y, aspectRatio });
                      else add(x, y);
                    }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- Coordinates are authored on the original layer image. */}
                    <img src={layer.src} alt={layer.label} draggable={false} onError={() => setAspectRatio(-1)}
                      onLoad={({ currentTarget: image }) => setAspectRatio(image.naturalWidth / image.naturalHeight)} />
                    {selected && <span aria-hidden="true" style={{ left: `${selected.x * 100}%`, top: `${selected.y * 100}%` }} />}
                  </button>
                </div>
              </div>
            </div>
            <fieldset className={styles.anchorPointFields} disabled={disabled} aria-label="Anchor point properties">
              {selected && <label className={styles.compactField}>Point
                <select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
                  {points.map((point) => <option key={point.id} value={point.id}>{point.label}</option>)}
                </select>
              </label>}
              <button type="button" disabled={!canAdd} onClick={() => add()}>Add anchor point</button>
              <p className={styles.note}>{aspectRatio < 0 ? 'The artwork could not be loaded.' : selected
                ? 'Click the artwork to move the selected point, or adjust X and Y below.'
                : 'Click the artwork to place your first anchor point.'}</p>
              {selected && <label className={styles.compactField}>Name
                <input className={styles.field} key={selected.id} defaultValue={selected.label} maxLength={80}
                  onBlur={(event) => {
                    const label = event.target.value.trim() || selected.label;
                    event.target.value = label;
                    if (label !== selected.label) patch({ label });
                  }} />
              </label>}
              {selected && <div className={styles.anchorPointCoordinates}>
                {(['x', 'y'] as const).map((axis) => <label key={axis} className={styles.compactField}>
                  {axis === 'x' ? 'X %' : 'Y %'}
                  <input className={styles.field} type="number" min={0} max={100} step={0.1}
                    value={Number((selected[axis] * 100).toFixed(2))} onChange={(event) => {
                      if (Number.isFinite(event.target.valueAsNumber)) patch({ [axis]: clampPoseValue(event.target.valueAsNumber / 100) });
                    }} />
                </label>)}
              </div>}
            </fieldset>
          </div>
        </>}
      </dialog>
    </div>
  );
}
