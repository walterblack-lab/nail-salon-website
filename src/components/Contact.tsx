import { useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { site } from '../content/site';
import { InstagramIcon } from './InstagramIcon';
import { NailMark } from './NailMark';
import './Contact.css';

const weekOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday first, as in Hungary

export function Contact() {
  const { t } = useI18n();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [today] = useState(() => new Date().getDay());
  const q = encodeURIComponent(site.mapsQuery);
  const { street, postalCode, city } = site.address;

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__info">
          <h2 className="section-title contact__title" id="contact-title" data-reveal>
            {t.contact.heading}
          </h2>
          <p className="contact__intro" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            {t.contact.intro}
          </p>

          {/* Big, tappable contact lines */}
          <dl className="contact__lines">
            <div>
              <dt>{t.contact.phone}</dt>
              <dd>
                <a href={site.phoneHref}>{site.phone}</a>
              </dd>
            </div>
            <div>
              <dt>{t.contact.email}</dt>
              <dd>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
            <div>
              <dt>{t.contact.instagram}</dt>
              <dd>
                <a href={site.instagram.url} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon size={22} />
                  {site.instagram.handle}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="contact__hours" data-reveal="pop" style={{ '--rest-rotate': '-2deg', '--pop-rotate': '-8deg' } as React.CSSProperties}>
          <h3 className="contact__hours-title">{t.contact.hours}</h3>
          <ul>
            {weekOrder.map((d) => {
              const h = site.hours[d];
              const isToday = d === today;
              return (
                <li key={d} className={`${isToday ? 'is-today' : ''}${h ? '' : ' is-closed'}`}>
                  <span>
                    {t.contact.days[d]}
                    {isToday && <span className="contact__today">{t.contact.today}</span>}
                  </span>
                  <span>{h ? `${h.open}–${h.close}` : t.contact.closed}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="contact__map">
          {mapLoaded ? (
            <iframe
              title={t.contact.map.title}
              src={`https://www.google.com/maps?q=${q}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="map-card">
              <NailMark size={64} color="var(--plum)" className="map-card__pin" />
              <p className="map-card__label">{t.contact.address}</p>
              <p className="map-card__address">
                {street}
                <br />
                {postalCode} {city}
              </p>
              <p className="map-card__notice">{t.contact.map.notice}</p>
              <div className="map-card__actions">
                <button type="button" className="btn" onClick={() => setMapLoaded(true)}>
                  {t.contact.map.load}
                </button>
                <a
                  className="ink-link"
                  style={{ '--hl': 'var(--paper)' } as React.CSSProperties}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.contact.map.directions}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
