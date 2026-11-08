'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import styles from './EditorActions.module.css';

/** A native disclosure, not a modal: Tab remains normal and Escape returns to its trigger. */
export function EditorActions({ label, children, align = 'end' }: { label: string; children: ReactNode; align?: 'start' | 'end' }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node) && ref.current) ref.current.open = false; };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return <details ref={ref} className={styles.actions} data-align={align} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.stopPropagation(); if (ref.current) ref.current.open = false; trigger.current?.focus(); }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    if ((event.target as HTMLElement).matches('input, select, textarea')) return;
    event.preventDefault();
    if (ref.current) ref.current.open = true;
    const buttons = [...(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : index < 0 ? event.key === 'ArrowDown' ? 0 : buttons.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }}>
    <summary ref={trigger} role="button" aria-label={label} title={label}><Icon name="more-vertical" size={17} /></summary>
    <div className={styles.menu} role="group" aria-label={label}>{children}</div>
  </details>;
}

export function ConfirmEditorAction({ label, description, onConfirm, disabled = false }: {
  label: string; description: string; onConfirm: () => void; disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? <div className={styles.confirm} role="alert">
    <strong>{label}?</strong><p>{description}</p>
    <div><button type="button" onClick={() => setConfirming(false)}>Cancel</button>
      <button type="button" disabled={disabled} onClick={(event) => {
        onConfirm(); setConfirming(false);
        const details = event.currentTarget.closest('details'); if (details) details.open = false;
      }}>Confirm {label.toLowerCase()}</button></div>
  </div> : <button type="button" disabled={disabled} onClick={() => setConfirming(true)}>{label}</button>;
}
