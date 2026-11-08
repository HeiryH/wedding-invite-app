import type { SVGProps } from 'react';

// Original hand-authored vectors interpreting the six approved local ink ornaments.
// No raster references, font outlines, embedded images or generated extraction manifests.
const ink = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
export function Heart({ x = 0, y = 0, size = 1 }: { x?: number; y?: number; size?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${size})`} d="M0 7C-14-4-9-12-3-7L0-2C7-17 16-6 0 7Z" fill="#a00407" stroke="none" />;
}
export function Ribbon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 440 190" aria-hidden="true" {...props} {...ink}>
    <path d="M-10 27C81 7 62 112 159 113C203 114 229 95 278 102C321 109 328 169 383 164C406 163 426 152 450 160M-10 51C84 22 88 139 168 128C224 122 244 94 278 102C315 113 302 186 376 180C411 178 433 168 450 185" />
    <path d="M278 102C251 81 220 56 219 79C216 98 252 92 278 102C299 78 335 74 337 98C341 126 294 109 278 102ZM278 102C246 88 227 65 218 76M279 103C310 91 328 89 336 99" />
    <ellipse cx="279" cy="102" rx="6" ry="5" fill="#fffbf2" />
    <Heart x={180} y={39} size={.85} /><Heart x={384} y={98} size={.8} />
    <path d="M106 24L109 32L106 40L103 32ZM412 113L416 122L412 130L409 122ZM274 147L278 155L274 164L271 155M45 112Q49 99 59 104Q52 97 70 93M353 147Q363 145 359 137" />
    {[32, 40, 143, 148, 245, 252].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 86 : 96} r=".8" fill="currentColor" />)}
  </svg>;
}
export function Medallion(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 110 330" aria-hidden="true" {...props} {...ink}>
    <path d="M54 60C26 24 75 14 57 54C45 84 22 91 32 121C39 145 80 150 92 123C117 70 48 87 35 115C11 151-9 115 5 91C21 65 48 76 63 104C91 143 55 164 48 183C31 226 80 225 59 190C43 166 24 154 35 130" transform="translate(4 50)" />
    <path d="M53 27L58 36L53 45L49 36ZM53 285L58 293L53 301L49 293M53 53V61M43 55L40 48M64 55L68 48M12 115L22 118M9 124H19M88 114L98 110M88 123H99M24 239L31 232M77 238L70 231M44 270L47 264M61 269L59 263" />
    <g fill="#a00407" stroke="none"><ellipse cx="54" cy="162" rx="4" ry="11" /><ellipse cx="54" cy="184" rx="4" ry="10" /><ellipse cx="43" cy="173" rx="10" ry="4" /><ellipse cx="65" cy="173" rx="10" ry="4" /></g>
  </svg>;
}
export function Trail({ envelopes = false, ...props }: SVGProps<SVGSVGElement> & { envelopes?: boolean }) {
  return <svg viewBox="0 0 76 760" aria-hidden="true" {...props} {...ink}>
    <path d="M31 7C95 73-8 105 36 174C79 244-8 291 29 271C66 250 59 338 32 372C-3 427 75 457 37 526C10 570 14 590 36 585C59 574 60 603 34 639C-5 693 41 722 38 702C35 683 7 729 20 751" />
    {envelopes ? [142, 382, 622].map((y) => <g key={y} transform={`translate(6 ${y}) rotate(-14 28 18)`}>
      <path d="M0 0L57 2L56 36L2 34ZM1 1L29 23L57 2M3 33L22 17M55 35L37 17" fill="#fffbf2" />
      <Heart x={29} y={22} size={.55} />
    </g>) : <><Heart x={34} y={168} /><Heart x={32} y={572} /><path d="M32 370C-11 342-6 387 32 370C63 333 84 368 32 370C34 393 52 412 65 403M32 371C16 390 5 413 16 426" stroke="#a00407" /></>}
    <path d="M17 15L12 6M14 25L2 22M15 36L6 39" />
  </svg>;
}
export function Flourish(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 280 40" aria-hidden="true" {...props} {...ink} stroke="#a00407">
    <path d="M4 28C42-2 88 38 118 17M160 23C190 43 237 11 276 17M139 28C118 8 132-3 139 11C151-9 169 3 139 28Z" />
  </svg>;
}
export function Note(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 110 100" aria-hidden="true" {...props} {...ink}>
    <path d="M19 25L92 18L91 76L4 87ZM91 76L68 68L64 82M68 68L91 54M91 8L94 1M81 10L80 1M102 13L109 8" />
    <path d="M46 57C30 38 45 30 48 46C60 26 72 42 46 57Z" stroke="#a00407" />
  </svg>;
}
export function Flash(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 50 700" aria-hidden="true" {...props} {...ink}>
    {[15, 195, 375, 555].map((y) => <g key={y} transform={`translate(0 ${y})`}><path d="M28 0L39 19M17 15L31 28M8 33L29 40M9 76L24 69M20 97L33 78M27 133L30 140L27 148L24 140Z" /></g>)}
  </svg>;
}
