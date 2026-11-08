'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';
import styles from './CinematicReferenceRail.module.css';

export interface ReferencePatch {
  referenceSrc?: string;
  referenceLabel?: string;
  referenceFit?: 'contain' | 'cover' | 'fill';
  referenceOpacity?: number;
}
export interface CinematicReferenceControls {
  beat: ReferencePatch & { id: string; label: string };
  visible: boolean;
  opacity: number;
  onVisibleChange: (visible: boolean) => void;
  onChange: (id: string, patch: ReferencePatch) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

/** Editor-only guide controls. No layer visibility or invitation artwork is changed here. */
export default function CinematicReferenceRail({ beat, visible, opacity, onVisibleChange, onChange, onUploadImage }: CinematicReferenceControls) {
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const railRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const hasReference = Boolean(beat.referenceSrc);
  const value = beat.referenceOpacity ?? opacity;
  useEffect(() => {
    if (!position) return;
    closeRef.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!railRef.current?.contains(event.target as Node) && !dialogRef.current?.contains(event.target as Node)) setPosition(undefined);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); setPosition(undefined); infoRef.current?.focus(); }
    };
    const resized = () => setPosition(undefined);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', resized);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', resized);
    };
  }, [position]);

  return <div ref={railRef} className={styles.rail} role="group" aria-label={`Reference controls for ${beat.label}`}>
    <output className={styles.value} aria-hidden="true">{hasReference ? `${Math.round(value * 100)}%` : '—'}</output>
    <input className={styles.slider} type="range" min={0} max={1} step={.01}
      value={value} disabled={!hasReference || !visible} aria-label="Reference opacity" aria-orientation="vertical"
      aria-valuetext={`${Math.round(value * 100)} percent`} title={`Reference opacity · ${beat.label}`}
      onChange={(event) => onChange(beat.id, { referenceOpacity: Number(event.target.value) })} />
    <button type="button" className={styles.icon} disabled={!hasReference} aria-pressed={visible && hasReference}
      aria-label={visible && hasReference ? 'Hide reference' : 'Show reference'} title={hasReference ? `${visible ? 'Hide' : 'Show'} reference` : 'No reference for this beat'}
      onClick={() => onVisibleChange(!visible)}><Icon name={visible && hasReference ? 'eye' : 'eye-off'} size={17} /></button>
    <button ref={infoRef} type="button" className={styles.icon} aria-label="Reference information" title={`Reference information · ${beat.label}`}
      aria-expanded={Boolean(position)} aria-controls={position ? id : undefined} aria-haspopup="dialog"
      onClick={() => {
        if (position) { setPosition(undefined); return; }
        const box = infoRef.current!.getBoundingClientRect();
        setPosition({ left: Math.max(12, Math.min(window.innerWidth - 296, box.right + 12)), top: Math.max(12, Math.min(window.innerHeight - 440, box.top - 200)) });
      }}><Icon name="info" size={17} /></button>
    {position && createPortal(<div ref={dialogRef} id={id} className={styles.popover} role="dialog" aria-labelledby={`${id}-title`} style={position}>
      <header><strong id={`${id}-title`}>Reference</strong><button ref={closeRef} type="button" className={styles.icon} aria-label="Close reference information"
        onClick={() => { setPosition(undefined); infoRef.current?.focus(); }}><Icon name="x" size={16} /></button></header>
      <p className={styles.beat}>{beat.label}</p>
      {hasReference ? <>{/* eslint-disable-next-line @next/next/no-img-element -- Reference uploads retain intrinsic proportions and direct source loading in the editor. */}
                        <img className={styles.thumbnail} src={beat.referenceSrc} alt={beat.referenceLabel || 'Composition reference'} />
        <p className={styles.name}>{beat.referenceLabel || 'Composition reference'}</p>
        <label className={styles.field}>Image fit<select aria-label="Reference fit" value={beat.referenceFit ?? 'contain'}
          onChange={(event) => onChange(beat.id, { referenceFit: event.target.value as ReferencePatch['referenceFit'] })}>
          <option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Stretch</option>
        </select></label></> : <p className={styles.empty}>No reference image for this beat. Add one to compare your composition.</p>}
      <div className={styles.actions}>
        <button type="button" disabled={!onUploadImage || uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : hasReference ? 'Replace reference' : 'Add reference'}</button>
        {hasReference && <button type="button" disabled={uploading} onClick={() => onChange(beat.id, { referenceSrc: '', referenceLabel: '' })}>Remove reference</button>}
      </div>
      <p className={styles.hint}>Editor guide only. Not shown to guests.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>, document.body)}
    <input ref={fileRef} hidden type="file" accept="image/*" aria-label="Upload reference image" onChange={async (event) => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file || !onUploadImage) return;
      const beatId = beat.id;
      setUploading(true); setError('');
      try { const referenceSrc = await onUploadImage(file); onChange(beatId, { referenceSrc, referenceLabel: file.name }); }
      catch { setError('Could not upload the reference. Please try again.'); }
      finally { setUploading(false); }
    }} />
  </div>;
}
