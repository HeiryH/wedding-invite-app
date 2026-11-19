'use client';

import { defaultTextBox, defaultTextGradient, defaultTextOutline, textShadowPresets, type CinematicTextEffects } from './textEffects';
import type { CinematicWorldGeometry, CinematicWorldLayer } from './world';
import styles from './CinematicAdjustPanel.module.css';

function Range({ label, value, min = 0, max, step, onChange }: {
  label: string; value: number; min?: number; max: number; step: number;
  onChange: (value: number) => void;
}) {
  return <label className={styles.compactField}>{label}
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(event) => onChange(event.target.valueAsNumber)} />
    <output>{value}</output>
  </label>;
}

function Colour({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className={styles.compactField}>{label}
    <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
  </label>;
}

export default function TextStyleEditor({ layer, onChange }: { layer: CinematicWorldLayer; onChange: (patch: Partial<CinematicWorldGeometry>) => void }) {
  const effects = layer.textEffects ?? {};
  const { shadow, outline, gradient } = effects;
  const box = effects.box ?? { ...defaultTextBox, paddingX: layer.borderWidth ? defaultTextBox.paddingX : 0, paddingY: layer.borderWidth ? defaultTextBox.paddingY : 0 };
  const patch = (next: Partial<CinematicTextEffects>) => onChange({ textEffects: { ...effects, ...next } });
  return <div className={styles.textStyleTools}>
    <details className={styles.timingEditor}>
      <summary>Text shadow</summary>
      <div className={styles.actionRow}>
        {([['soft', 'Soft shadow'], ['drop', 'Drop shadow'], ['glow', 'Glow']] as const).map(([id, label]) =>
          <button key={id} type="button" onClick={() => patch({ shadow: textShadowPresets[id] })}>{label}</button>)}
        {shadow && <button type="button" onClick={() => patch({ shadow: undefined })}>Remove shadow</button>}
      </div>
      {shadow && <>
        <Colour label="Shadow colour" value={shadow.color} onChange={(color) => patch({ shadow: { ...shadow, color } })} />
        <Range label="Shadow opacity" value={Math.round(shadow.opacity * 100)} max={100} step={1} onChange={(value) => patch({ shadow: { ...shadow, opacity: value / 100 } })} />
        <Range label="Shadow blur (px)" value={shadow.blur} max={30} step={.5} onChange={(blur) => patch({ shadow: { ...shadow, blur } })} />
        <div className={styles.twoColumn}>
          <Range label="Shadow X (px)" value={shadow.x} min={-20} max={20} step={.5} onChange={(x) => patch({ shadow: { ...shadow, x } })} />
          <Range label="Shadow Y (px)" value={shadow.y} min={-20} max={20} step={.5} onChange={(y) => patch({ shadow: { ...shadow, y } })} />
        </div>
      </>}
    </details>
    <details className={styles.timingEditor}>
      <summary>Letter outline</summary>
      <label className={styles.compactField}>Show outline
        <input type="checkbox" checked={!!outline} onChange={(event) => patch({ outline: event.target.checked ? defaultTextOutline : undefined })} />
      </label>
      {outline && <>
        <Colour label="Outline colour" value={outline.color} onChange={(color) => patch({ outline: { ...outline, color } })} />
        <Range label="Outline width (px)" value={outline.width} max={8} step={.25} onChange={(width) => patch({ outline: { ...outline, width } })} />
        <Range label="Outline opacity" value={Math.round(outline.opacity * 100)} max={100} step={1} onChange={(value) => patch({ outline: { ...outline, opacity: value / 100 } })} />
      </>}
    </details>
    <details className={styles.timingEditor}>
      <summary>Text fill</summary>
      <label className={styles.compactField}>Fill type
        <select value={gradient ? 'gradient' : 'solid'} onChange={(event) => patch({ gradient: event.target.value === 'gradient' ? defaultTextGradient : undefined })}>
          <option value="solid">Solid colour</option><option value="gradient">Gradient</option>
        </select>
      </label>
      {gradient ? <>
        <div className={styles.twoColumn}>
          <Colour label="Gradient start" value={gradient.start} onChange={(start) => patch({ gradient: { ...gradient, start } })} />
          <Colour label="Gradient end" value={gradient.end} onChange={(end) => patch({ gradient: { ...gradient, end } })} />
        </div>
        <Range label="Gradient angle" value={gradient.angle} max={360} step={1} onChange={(angle) => patch({ gradient: { ...gradient, angle } })} />
      </> : <Colour label="Text colour" value={layer.color ?? '#4a3a32'} onChange={(color) => onChange({ color })} />}
    </details>
    <details className={styles.timingEditor}>
      <summary>Text box</summary>
      <div className={styles.twoColumn}>
        <Colour label="Border colour" value={layer.borderColor ?? '#4a3a32'} onChange={(borderColor) => onChange({ borderColor })} />
        <Colour label="Background colour" value={box.color} onChange={(color) => patch({ box: { ...box, color, opacity: box.opacity || 1 } })} />
      </div>
      <Range label="Border width (px)" value={layer.borderWidth ?? 0} max={20} step={.5} onChange={(borderWidth) => onChange({ borderWidth, borderColor: layer.borderColor ?? '#4a3a32' })} />
      <Range label="Corner radius (px)" value={layer.radius ?? 0} max={100} step={1} onChange={(radius) => onChange({ radius })} />
      <Range label="Background opacity" value={Math.round(box.opacity * 100)} max={100} step={1} onChange={(value) => patch({ box: { ...box, opacity: value / 100 } })} />
      <div className={styles.twoColumn}>
        <Range label="Horizontal padding (em)" value={box.paddingX} max={3} step={.05} onChange={(paddingX) => patch({ box: { ...box, paddingX } })} />
        <Range label="Vertical padding (em)" value={box.paddingY} max={3} step={.05} onChange={(paddingY) => patch({ box: { ...box, paddingY } })} />
      </div>
    </details>
  </div>;
}
