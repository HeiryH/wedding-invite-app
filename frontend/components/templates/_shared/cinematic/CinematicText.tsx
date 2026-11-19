import { isValidElement, type CSSProperties, type ReactNode } from 'react';
import { splitTextReveal, textGlitchStyle, textPaint, type CinematicTextEffects, type TextGlitch, type TextReveal } from './textEffects';
import styles from './CinematicText.module.css';

export interface CinematicTextMotion {
  textReveal?: TextReveal;
  revealAmount?: number;
  shadowOpacity?: number;
  burst?: { glitch: TextGlitch; phase: number };
}

export function hasTextPaint(effects?: CinematicTextEffects) {
  return Boolean(effects?.shadow || effects?.outline || effects?.gradient);
}

// Preserve authored line breaks while leaving rich markup on its native render path.
function plainText(node: ReactNode): string | undefined {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (node == null || typeof node === 'boolean') return '';
  if (isValidElement(node) && node.type === 'br') return '\n';
  if (Array.isArray(node)) {
    const parts = node.map(plainText);
    return parts.includes(undefined) ? undefined : parts.join('');
  }
}

export default function CinematicText({ children, effects, motion, richHtml }: {
  children?: ReactNode; effects?: CinematicTextEffects; motion?: CinematicTextMotion; richHtml?: { __html: string };
}) {
  const mode = motion?.textReveal;
  const amount = motion?.revealAmount ?? 1;
  const text = mode && amount < 1 && !richHtml ? plainText(children) : undefined;
  const { style, filter } = textPaint(effects, motion?.shadowOpacity);
  const burstStyle = textGlitchStyle(motion?.burst?.glitch, motion?.burst?.phase);
  const treatment: CSSProperties = { ...burstStyle, filter: [filter, burstStyle?.filter].filter(Boolean).join(' ') || undefined };

  if (richHtml) return <div style={{ ...style, ...treatment }} dangerouslySetInnerHTML={richHtml} />;
  if (filter && text === undefined) {
    return <span style={treatment}><span style={style}>{children}</span></span>;
  }
  if (!mode || text === undefined) return <span style={{ ...style, ...treatment }}>{children}</span>;

  const [visible, hidden] = splitTextReveal(text, mode, amount);
  return <>
    <span className={styles.screenReaderText}>{text}</span>
    <span aria-hidden="true" style={{ ...treatment, whiteSpace: text.includes('\n') ? 'pre-wrap' : undefined }}>
      <span style={style}>{visible}</span><span className={styles.unrevealed} style={style}>{hidden}</span>
    </span>
  </>;
}
