import { Fragment, useMemo, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { gallery, galleryCategories, type GalleryCategory } from '../content/gallery';
import { site } from '../content/site';
import { Picture } from './Picture';
import { Lightbox } from './Lightbox';
import { InstagramIcon } from './InstagramIcon';
import { NailMark } from './NailMark';
import './Gallery.css';

type Filter = GalleryCategory | 'all';

/** Collage rhythm: each photo takes the next size in this cycle (see Gallery.css). */
const sizes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
const categoryColor: Record<GalleryCategory, string> = {
  french: 'var(--paper)',
  chrome: 'var(--lavender)',
  art: 'var(--butter)',
  nude: 'var(--powder)',
  sculpted: 'var(--sage)',
  seasonal: 'var(--butter)',
};
const IG_AFTER = 4;

export function Gallery() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo(() => (filter === 'all' ? gallery : gallery.filter((g) => g.category === filter)), [filter]);
  const filters: Filter[] = ['all', ...galleryCategories.filter((c) => gallery.some((g) => g.category === c))];
  const igIndex = Math.min(IG_AFTER, items.length);

  const igTile = (
    <li key="instagram" className="collage__ig">
      <a href={site.instagram.url} target="_blank" rel="noopener noreferrer">
        <InstagramIcon size={30} />
        <span className="collage__ig-title">{t.gallery.igTitle}</span>
        <span className="collage__ig-text">
          {t.gallery.igText} {site.instagram.handle}
        </span>
      </a>
    </li>
  );

  return (
    <section className="gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <header className="gallery__head">
          <h2 className="section-title gallery__title" id="gallery-title" data-reveal>
            {t.gallery.heading}
            <sup className="gallery__count">{gallery.length}</sup>
          </h2>
          <p className="gallery__intro" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            {t.gallery.intro}
          </p>
          <div className="gallery__filters" role="group" aria-label={t.gallery.filterLabel}>
            {filters.map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f !== 'all' && <NailMark size={13} color={categoryColor[f]} className="chip__mark" />}
                {f === 'all' ? t.gallery.all : t.gallery.categories[f]}
              </button>
            ))}
          </div>
        </header>

        <ul className="collage" key={filter}>
          {items.map((item, i) => (
            <Fragment key={item.image}>
              {i === igIndex && igTile}
              <li
                className={`collage__item collage__item--${sizes[i % sizes.length]}`}
                style={{ '--i': i % 8 } as React.CSSProperties}
              >
                <button type="button" className="collage__btn" onClick={() => setOpenIndex(i)} aria-label={t.gallery.enlarge(item.caption[lang])}>
                  <Picture name={item.image} alt="" sizes="(min-width: 1024px) 40vw, 50vw" className="collage__img" />
                  <span className="collage__chip" aria-hidden="true" style={{ '--chip': categoryColor[item.category] } as React.CSSProperties}>
                    {t.gallery.categories[item.category]}
                  </span>
                </button>
              </li>
            </Fragment>
          ))}
          {igIndex >= items.length && igTile}
        </ul>
      </div>

      {openIndex !== null && (
        <Lightbox items={items} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  );
}
