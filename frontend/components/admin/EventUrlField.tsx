'use client';

import { useEffect, useRef, useState } from 'react';
import { eventService } from '@/lib/api';
import { urlSegmentForEventType } from '@/lib/eventTypes';
import { slugifyWhileTyping, slugify, slugProblem } from '@/lib/slug';

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

/**
 * The event's public URL, as an editable field with a live availability check.
 *
 * It used to be derived from the names and shown read-only ("Auto-generated URL"), which meant a
 * second couple with the same first names simply couldn't be created — the collision only
 * surfaced as a failed save with no way to resolve it. The derivation is still the default, so
 * the common case is unchanged: `suggestion` flows into the field until the admin types, after
 * which the field is theirs and stops following the names.
 *
 * `onStatusChange` lets the form disable its submit while a URL is known-bad. Availability is
 * still re-checked server-side on save — this check is a courtesy, and two admins can race.
 */
export default function EventUrlField({
  eventType,
  value,
  onChange,
  suggestion,
  excludeId,
  onStatusChange,
  inputStyle,
  labelSlot,
  hint = 'Letters, numbers and hyphens. This is the link guests will open.',
}: {
  eventType: string;
  value: string;
  onChange: (slug: string) => void;
  /** Derived from the names; used until the admin edits the field. */
  suggestion: string;
  /** When renaming, the event allowed to keep this slug. */
  excludeId?: number;
  onStatusChange?: (status: SlugStatus) => void;
  inputStyle: React.CSSProperties;
  /**
   * The host page's own field-label renderer, so this matches its surroundings. Pass
   * `() => null` where the surrounding panel already says what the field is.
   */
  labelSlot: (text: string) => React.ReactNode;
  /** Hint text under the field. Defaults to the create form's wording. */
  hint?: string;
}) {
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<SlugStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  // Follow the names until the admin takes the field over.
  useEffect(() => {
    if (touched) return;
    if (suggestion !== value) onChange(suggestion);
  }, [suggestion, touched, value, onChange]);

  useEffect(() => { onStatusChange?.(status); }, [status, onStatusChange]);

  // Debounced check. The sequence guard matters: a slow answer for an older slug must not
  // overwrite the verdict for what's in the box now.
  const seq = useRef(0);
  useEffect(() => {
    const slug = slugify(value);
    const problem = slugProblem(slug);
    if (problem) {
      setStatus(slug ? 'invalid' : 'idle');
      setMessage(slug ? problem : null);
      return;
    }
    setStatus('checking');
    setMessage(null);
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const result = await eventService.checkSlug(slug, excludeId);
        if (mine !== seq.current) return;
        setStatus(result.available ? 'available' : 'taken');
        setMessage(result.available ? null : result.reason ?? 'That URL is already taken.');
      } catch {
        if (mine !== seq.current) return;
        // A failed check must not block the save — the server checks again anyway.
        setStatus('idle');
        setMessage(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value, excludeId]);

  const tone =
    status === 'available' ? 'var(--success, #2f7d4f)'
    : status === 'taken' || status === 'invalid' ? 'var(--danger)'
    : 'var(--muted, var(--text-muted))';

  const prefix = `/${urlSegmentForEventType(eventType)}/`;

  return (
    <div>
      {labelSlot('Public URL *')}
      <div
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: 0,
          overflow: 'hidden',
          borderColor:
            status === 'taken' || status === 'invalid' ? 'var(--danger)' : inputStyle.borderColor,
        }}
      >
        <span
          style={{
            padding: '10px 0 10px 12px',
            fontFamily: 'var(--mono, var(--font-mono))',
            fontSize: 13,
            color: 'var(--muted, var(--text-muted))',
            whiteSpace: 'nowrap',
          }}
        >
          {prefix}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setTouched(true);
            onChange(slugifyWhileTyping(e.target.value));
          }}
          onBlur={(e) => onChange(slugify(e.target.value))}
          placeholder="sarah-and-michael"
          required
          style={{
            flex: 1,
            minWidth: 0,
            padding: '10px 12px 10px 0',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--mono, var(--font-mono))',
            fontSize: 13,
            color: 'var(--ink, var(--text))',
          }}
        />
        <span style={{ padding: '0 12px', fontSize: 12, color: tone, whiteSpace: 'nowrap' }}>
          {status === 'checking' ? 'Checking…' : status === 'available' ? 'Available' : ''}
        </span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: message ? 'var(--danger)' : 'var(--muted, var(--text-muted))' }}>
        {message ?? hint}
      </p>
    </div>
  );
}
