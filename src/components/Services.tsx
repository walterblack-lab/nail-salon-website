import { useI18n } from '../i18n/LanguageContext';
import { services, type ServiceId } from '../content/services';
import { formatPrice } from '../lib/schedule';
import { Picture } from './Picture';
import { NailMark } from './NailMark';
import './Services.css';

export function Services({ onBook }: { onBook: (id: ServiceId) => void }) {
  const { t, lang } = useI18n();
  const s = t.services;

  return (
    <section className="services" id="services" aria-labelledby="services-title">
      <div className="container">
        <header className="services__head">
          <h2 className="section-title services__title" id="services-title" data-reveal>
            {s.heading}
          </h2>
          <p className="services__intro" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            {s.intro}
          </p>
        </header>

        <ul className="menu">
          {services.map((svc, i) => {
            const copy = s.items[svc.id];
            const from = 'from' in svc && svc.from;
            const perNail = 'perNail' in svc && svc.perNail;
            const image = 'image' in svc ? svc.image : undefined;
            return (
              <li
                key={svc.id}
                className={`panel panel--${svc.id} panel--${svc.color}${image ? ' has-image' : ''}`}
                data-reveal
                style={{ '--reveal-delay': `${(i % 3) * 90}ms` } as React.CSSProperties}
              >
                <div className="panel__body">
                  <p className="panel__duration">
                    <span className="visually-hidden">{s.durationLabel}: </span>
                    {copy.duration ?? s.duration(svc.durationMin)}
                  </p>
                  <h3 className="panel__name">{copy.name}</h3>
                  <p className="panel__desc">{copy.desc}</p>
                </div>

                <p className="panel__price">
                  <span className="visually-hidden">{s.priceLabel}: </span>
                  {from && s.fromPrefix && <span className="panel__unit">{s.fromPrefix}</span>}
                  <span className="panel__amount">{formatPrice(svc.price, lang)}</span>
                  <span className="panel__unit">
                    {s.currency}
                    {from && s.fromSuffix}
                    {perNail && ` ${s.perNail}`}
                  </span>
                </p>

                {image && (
                  <figure className="panel__img arch" aria-hidden="true">
                    <Picture name={image} alt="" sizes="(min-width: 1024px) 18vw, 40vw" />
                  </figure>
                )}

                <a className="panel__book" href="#booking" aria-label={s.bookAria(copy.name)} onClick={() => onBook(svc.id)}>
                  <NailMark size={15} />
                  {s.book}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
