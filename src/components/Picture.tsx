import type { CSSProperties } from 'react';
import { images, type ImageName } from '../content/images.generated';

interface PictureProps {
  name: ImageName;
  alt: string;
  /** Rendered width hint for the browser, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  className?: string;
  /** Load immediately with high priority (hero only). */
  priority?: boolean;
  style?: CSSProperties;
}

/** Responsive, lazy-loaded image with reserved space and a placeholder colour. */
export function Picture({ name, alt, sizes, className, priority, style }: PictureProps) {
  const img = images[name];
  return (
    <img
      className={className}
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      style={{ backgroundColor: img.color, ...style }}
    />
  );
}
