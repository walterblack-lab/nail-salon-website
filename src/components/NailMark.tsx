import type { CSSProperties } from 'react';

/** The brand motif: an almond nail shape. Decorative unless a title is given. */
export function NailMark({ size = 18, color = 'currentColor', className, style }: { size?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      width={size * 0.66}
      height={size}
      viewBox="0 0 20 30"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 1C16.5 5 19 13 19 19.5 19 25.2 15 29 10 29S1 25.2 1 19.5C1 13 3.5 5 10 1Z" fill={color} />
    </svg>
  );
}
