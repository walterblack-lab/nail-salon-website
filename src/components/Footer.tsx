import { useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { site } from '../content/site';
import { InstagramIcon } from './InstagramIcon';
import { LanguageSwitch } from './LanguageSwitch';
import { NailMark } from './NailMark';
import './Footer.css';

const dotColors = ['var(--butter)', 'var(--lavender)', 'var(--sage)', 'var(--powder)', 'var(--paper)'];

export function Footer() {
  const { t } = useI18n();
  const [year] = useState(() => new Date().getFullYear());
  const links = ['about', 'services', 'gallery', 'booking', 'contact'] as const;
  const label = (id: (typeof links)[number]) => (id === 'booking' ? t.nav.book : t.nav[id]);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__cta">
          <p className="site-footer__cta-text">{t.footer.cta}</p>
          <a className="btn btn--butter" href="#booking">
            {t.footer.ctaButton}
          </a>
        </div>

        <div className="site-footer__mid">
          <nav aria-label="Lábléc / Footer">
            <ul className="site-footer__nav">
              {links.map((id, i) => (
                <li key={id}>
                  <a href={`#${id}`}>
                    <NailMark size={14} color={dotColors[i]} />
                    {label(id)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-footer__tools">
            <a className="site-footer__ig" href={site.instagram.url} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={18} />
              {site.instagram.handle}
            </a>
            <LanguageSwitch />
          </div>
        </div>

        <p className="site-footer__meta">
          <span>
            {site.fullName}, {site.address.street} {site.address.postalCode} {site.address.city}
          </span>
          <span>{t.footer.rights(year)}</span>
        </p>
      </div>

      {/* Oversized wordmark, cropped by the page edge */}
      <a href="#top" className="site-footer__mark" aria-label={t.footer.backToTop}>
        <span aria-hidden="true">{site.name.toLowerCase()}</span>
        <NailMark size={120} color="var(--butter)" className="site-footer__mark-nail" />
      </a>
    </footer>
  );
}
