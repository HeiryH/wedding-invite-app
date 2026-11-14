'use client';

import { useEffect, useId, useRef } from 'react';
import type { Ref } from 'react';
import type { LandingMenuLink } from '@/lib/landing/menu';
import styles from './MarketingNav.module.css';

type MarketingNavProps = {
  links: LandingMenuLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctaRef: Ref<HTMLButtonElement>;
  ctaLabel: string;
  onCtaClick: () => void;
};

export function MarketingNav({ links, open, onOpenChange, ctaRef, ctaLabel, onCtaClick }: MarketingNavProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const panelId = useId();

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !open) return;
      onOpenChange(false);
      triggerRef.current?.focus();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open, onOpenChange]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  return (
    <>
      <div className={styles.backdrop} data-open={open} onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div
        className={styles.anchor}
        data-open={open}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' && !open) {
            hoverTimer.current = window.setTimeout(() => onOpenChange(true), 120);
          }
        }}
        onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            window.clearTimeout(hoverTimer.current);
            onOpenChange(!open);
          }}
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={panelId}
          className={styles.trigger}
        >
          <span className={styles.icon} aria-hidden="true"><span /><span /><span /></span>
        </button>

        <div className={styles.panelArea} inert={!open}>
          <nav id={panelId} aria-label="Landing page" className={styles.panel}>
            {links.length > 0 && (
              <div className={styles.links}>
                {links.map((link) => (
                  <a key={link.section} className={styles.link} href={`#${link.section}`} onClick={() => onOpenChange(false)}>
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            <button ref={ctaRef} className={`mkt-btn ${styles.cta}`} type="button" onClick={onCtaClick}>
              {ctaLabel}
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
