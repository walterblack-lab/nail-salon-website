import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { GalleryItem } from '../content/gallery';
import { images } from '../content/images.generated';
import './Lightbox.css';

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

export function Lightbox({ items, index, onIndexChange, onClose }: LightboxProps) {
  const { t, lang } = useI18n();
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [closing, setClosing] = useState(false);
  const item = items[index];
  const img = images[item.image];
  const count = items.length;

  const go = (delta: number) => onIndexChange((index + delta + count) % count);
  const requestClose = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onClose();
    setClosing(true);
    window.setTimeout(onClose, 280);
  };

  // Focus management + scroll lock; restore focus to the thumbnail on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add('is-locked');
    closeBtn.current?.focus();
    return () => {
      document.body.classList.remove('is-locked');
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        const nodes = [...(dialog.current?.querySelectorAll<HTMLElement>('button') ?? [])];
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Preload neighbours so next/previous feel instant.
  useEffect(() => {
    for (const d of [1, -1]) {
      const n = items[(index + d + count) % count];
      const pre = new Image();
      pre.sizes = '90vw';
      pre.srcset = images[n.image].srcSet;
    }
  }, [index, items, count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) requestClose();
    touchStart.current = null;
  };

  return createPortal(
    <div
      ref={dialog}
      className={`lightbox${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t.gallery.lightbox.label}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="lightbox__backdrop" onClick={requestClose} />

      <div className="lightbox__top">
        <p className="lightbox__counter label" aria-live="polite">
          {t.gallery.lightbox.counter(index + 1, count)}
        </p>
        <button ref={closeBtn} type="button" className="lightbox__btn lightbox__close" onClick={requestClose} aria-label={t.gallery.lightbox.close}>
          <X strokeWidth={1.75} size={22} aria-hidden="true" />
        </button>
      </div>

      <figure className="lightbox__figure">
        <img
          key={item.image}
          className="lightbox__img"
          src={img.src}
          srcSet={img.srcSet}
          sizes="(min-width: 1024px) 70vw, 100vw"
          width={img.width}
          height={img.height}
          alt={item.caption[lang]}
        />
        <figcaption className="lightbox__caption" key={`${item.image}-cap`}>
          <span className="label">{t.gallery.categories[item.category]}</span>
          <span className="lightbox__caption-text">{item.caption[lang]}</span>
        </figcaption>
      </figure>

      {count > 1 && (
        <>
          <button type="button" className="lightbox__btn lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label={t.gallery.lightbox.prev}>
            <ChevronLeft strokeWidth={1.75} size={26} aria-hidden="true" />
          </button>
          <button type="button" className="lightbox__btn lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label={t.gallery.lightbox.next}>
            <ChevronRight strokeWidth={1.75} size={26} aria-hidden="true" />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
