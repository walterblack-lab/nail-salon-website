import { useI18n } from '../i18n/LanguageContext';
import { Picture } from './Picture';
import { NailMark } from './NailMark';
import './About.css';

const valueColors = ['var(--butter)', 'var(--lavender)', 'var(--paper)', 'var(--powder)'];

export function About() {
  const { t } = useI18n();
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="about__layout">
        <figure className="about__photo" data-reveal>
          <Picture name="about-interior" alt={t.about.imageAlt} sizes="(min-width: 1024px) 55vw, 100vw" />
        </figure>

        <div className="about__panel" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
          <h2 className="about__title" id="about-title">
            {t.about.heading}
          </h2>
          <p className="lead about__lead">{t.about.lead}</p>
          <p className="about__body">{t.about.body}</p>
        </div>

        <figure
          className="about__polaroid"
          data-reveal="pop"
          style={{ '--rest-rotate': '-5deg', '--pop-rotate': '-14deg', '--reveal-delay': '200ms' } as React.CSSProperties}
        >
          <Picture name="about-detail" alt={t.about.detailAlt} sizes="(min-width: 1024px) 22vw, 60vw" />
        </figure>

        <ul className="about__values">
          {t.about.values.map((v, i) => (
            <li key={v.title} data-reveal style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}>
              <NailMark size={34} color={valueColors[i]} className="about__value-mark" />
              <div>
                <h3 className="about__value-title">{v.title}</h3>
                <p>{v.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
