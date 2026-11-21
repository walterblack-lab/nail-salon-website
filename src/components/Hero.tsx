import { useI18n } from '../i18n/LanguageContext';
import { Picture } from './Picture';
import { NailMark } from './NailMark';
import { Marquee } from './Marquee';
import './Hero.css';

export function Hero() {
  const { t } = useI18n();
  const sticker = t.hero.sticker.repeat(2);

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="hero__kicker">
            <NailMark size={16} color="var(--butter)" />
            {t.hero.kicker}
          </p>
          <h1 className="hero__title" id="hero-title">
            {t.hero.titleLines.map((line, i) => (
              <span key={i} className={`hero__line hero__line--${i + 1}`}>
                <span className="hero__line-inner" style={{ '--d': `${200 + i * 110}ms` } as React.CSSProperties}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="hero__lead">{t.hero.lead}</p>
          <div className="hero__actions">
            <a className="btn" href="#booking">
              {t.hero.cta}
            </a>
            <a className="ink-link" href="#gallery">
              {t.hero.secondary}
            </a>
          </div>
        </div>

        <div className="hero__art">
          <div className="hero__block" aria-hidden="true" />
          <figure className="hero__main arch">
            <Picture name="gal-handpainted-abstract" alt={t.hero.imageAlt} sizes="(min-width: 1024px) 34vw, 70vw" priority />
          </figure>
          <figure className="hero__second">
            <Picture name="gal-sculpted-blue" alt={t.hero.secondAlt} sizes="(min-width: 1024px) 18vw, 40vw" />
          </figure>
          <a className="hero__sticker" href="#booking" aria-label={t.hero.cta}>
            <svg className="hero__sticker-ring" viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <path id="sticker-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text>
                <textPath href="#sticker-circle">{sticker}</textPath>
              </text>
            </svg>
            <NailMark size={30} color="var(--plum)" className="hero__sticker-mark" />
          </a>
        </div>
      </div>

      <Marquee items={t.marquee} />
    </section>
  );
}
