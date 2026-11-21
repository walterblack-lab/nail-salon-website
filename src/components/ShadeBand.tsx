import { useState, type KeyboardEvent } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { shades, type ShadeId } from '../content/shades';
import { Picture } from './Picture';
import { NailMark } from './NailMark';
import './ShadeBand.css';

/** "Pick your shade": the band takes on the chosen colour; booking can carry it over. */
export function ShadeBand({ onBookShade }: { onBookShade: (name: string) => void }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState<ShadeId>('butter');
  const shade = shades.find((s) => s.id === current)!;
  const name = t.shades.names[current];

  // Arrow keys move through the swatches, as in a native radio group.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const idx = shades.findIndex((s) => s.id === current);
    const next = shades[(idx + dir + shades.length) % shades.length];
    setCurrent(next.id);
    (e.currentTarget.querySelector(`[data-shade="${next.id}"]`) as HTMLElement | null)?.focus();
  };

  return (
    <section
      className="shades"
      id="shades"
      aria-labelledby="shades-title"
      style={{ '--shade': shade.hex, '--shade-ink': shade.ink } as React.CSSProperties}
    >
      <div className="container shades__inner">
        <div className="shades__copy">
          <h2 className="section-title shades__title" id="shades-title">
            {t.shades.heading}
          </h2>
          <p className="shades__text">{t.shades.text}</p>

          <div className="shades__picker" role="radiogroup" aria-label={t.shades.pickerLabel} onKeyDown={onKeyDown}>
            {shades.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={current === s.id}
                tabIndex={current === s.id ? 0 : -1}
                data-shade={s.id}
                className="swatch"
                style={{ '--swatch': s.hex } as React.CSSProperties}
                onClick={() => setCurrent(s.id)}
                aria-label={t.shades.names[s.id]}
              >
                <NailMark size={46} color={s.hex} />
              </button>
            ))}
          </div>

          <p className="shades__current" aria-live="polite">
            <span>{t.shades.current}:</span> <strong>{name}</strong>
          </p>

          <a className="btn shades__cta" href="#booking" onClick={() => onBookShade(name)}>
            {t.shades.cta}
          </a>
        </div>

        <figure className="shades__figure arch">
          <Picture name="booking-still" alt={t.shades.imageAlt} sizes="(min-width: 1024px) 30vw, 70vw" />
        </figure>
      </div>
    </section>
  );
}
