'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CURATED_FONTS, fontVar } from '@/lib/fonts/registry';
import styles from './CinematicAdjustPanel.module.css';

export default function CinematicFontPicker({ value, defaultLabel, onChange, onPreview }: {
  value: string; defaultLabel: string; onChange: (value: string) => void;
  onPreview: (value?: string) => void;
}) {
  const fonts = [{ key: '', label: defaultLabel }, ...CURATED_FONTS];
  const chosen = fonts.find((font) => font.key === value) ?? fonts[0];
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | 'touch' | undefined>(undefined);
  const [active, setActive] = useState<string>();
  const open = active !== undefined;

  useEffect(() => {
    if (open) return () => onPreview();
  }, [open, onPreview]);

  const preview = (key: string) => {
    setActive(key);
    onPreview(key);
  };
  const close = () => {
    pointer.current = undefined;
    setActive(undefined);
  };
  const choose = (key: string) => {
    onChange(key);
    close();
    trigger.current?.focus();
  };
  const scrollTo = useCallback((key: string) => {
    const option = document.getElementById(`${id}-${key}`);
    const viewport = list.current;
    if (!viewport || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < viewport.scrollTop) viewport.scrollTop = top;
    if (bottom > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = bottom - viewport.clientHeight;
  }, [id]);
  useEffect(() => {
    if (open) scrollTo(chosen.key);
  }, [open, chosen.key, scrollTo]);

  const browseOption = (target: Element | null) => {
    const option = target?.closest<HTMLElement>('[data-font-option]');
    const key = option?.dataset.fontOption;
    if (key !== undefined && option && list.current?.contains(option) && key !== active) preview(key);
  };

  return <div className={styles.fontPicker}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <span id={`${id}-label`}>Font</span>
    <button ref={trigger} type="button" role="combobox" aria-labelledby={`${id}-label`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-fonts`}
      aria-activedescendant={open ? `${id}-${active}` : undefined}
      className={styles.field} style={{ fontFamily: fontVar(chosen.key) }}
      onClick={() => open ? close() : setActive(chosen.key)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) { event.stopPropagation(); close(); return; }
        if ((event.key === 'Enter' || event.key === ' ') && open) {
          event.preventDefault();
          choose(active);
          return;
        }
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        pointer.current = undefined;
        const index = fonts.findIndex((font) => font.key === (active ?? chosen.key));
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? fonts.length - 1
          : Math.max(0, Math.min(fonts.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)));
        preview(fonts[next].key);
        if (open) scrollTo(fonts[next].key);
        else requestAnimationFrame(() => scrollTo(fonts[next].key));
      }}>
      <span>{chosen.label}</span><span aria-hidden="true">⌄</span>
    </button>
    {open && <div id={`${id}-fonts`} ref={list} role="listbox" aria-labelledby={`${id}-label`} className={styles.fontOptions}
      onPointerMove={(event) => {
        if (event.pointerType === 'touch') return;
        pointer.current = { x: event.clientX, y: event.clientY };
        browseOption(event.target as Element);
      }}
      onPointerLeave={(event) => { if (event.pointerType !== 'touch') pointer.current = undefined; }}
      onPointerDown={(event) => { if (event.pointerType === 'touch') pointer.current = 'touch'; }}
      onMouseDown={(event) => { if ((event.target as HTMLElement).closest('[data-font-option]')) event.preventDefault(); }}
      onScroll={(event) => {
        const point = pointer.current;
        if (point === 'touch') {
          const rect = event.currentTarget.getBoundingClientRect();
          browseOption(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
        } else if (point) browseOption(document.elementFromPoint(point.x, point.y));
      }}>
      {fonts.map((font) => <div key={font.key} id={`${id}-${font.key}`} role="option" aria-selected={font.key === chosen.key}
        data-font-option={font.key} data-active={font.key === active ? '' : undefined}
        style={{ fontFamily: fontVar(font.key) }} onClick={() => choose(font.key)}>
        {font.label}
      </div>)}
    </div>}
  </div>;
}
