import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { site } from '../content/site';
import { InstagramIcon } from './InstagramIcon';
import { LanguageSwitch } from './LanguageSwitch';
import { NailMark } from './NailMark';
import './Header.css';

const sections = ['about', 'services', 'gallery', 'studio', 'contact'] as const;
const menuColors = ['var(--butter)', 'var(--paper)', 'var(--sage)', 'var(--plum)', 'var(--powder)'];

export function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the nav link of the section currently in view.
  useEffect(() => {
    const els = [...sections, 'shades', 'booking'].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    const top = new IntersectionObserver(([e]) => e.isIntersecting && setActive(null), { threshold: 0.4 });
    const hero = document.getElementById('top');
    if (hero) top.observe(hero);
    return () => {
      io.disconnect();
      top.disconnect();
    };
  }, []);

  // Mobile menu: lock scroll, close on Escape, keep focus inside.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('is-locked');
    const focusables = () =>
      [...(panel.current?.querySelectorAll<HTMLElement>('a, button') ?? [])].filter((el) => el.offsetParent !== null);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (e.key === 'Tab') {
        const items = [menuButton.current!, ...focusables()];
        const first = items[0];
        const last = items[items.length - 1];
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
    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-header__bar">
        <a className="logo" href="#top" aria-label={t.nav.home} onClick={close}>
          <NailMark size={22} className="logo__mark" />
          <span className="logo__name">{site.name.toLowerCase()}</span>
          <span className="logo__sub">{t.brandTagline}</span>
        </a>

        <nav className="site-nav" aria-label="Fő navigáció / Main">
          <ul>
            {sections.map((id) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={active === id ? 'location' : undefined}>
                  {t.nav[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a className="icon-link" href={site.instagram.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.nav.instagram} ${site.instagram.handle}`}>
            <InstagramIcon />
          </a>
          <LanguageSwitch className="site-header__lang" />
          <a className="btn btn--small site-header__book" href="#booking">
            {t.nav.book}
          </a>
          <button
            ref={menuButton}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="menu-toggle__line" />
            <span className="menu-toggle__line" />
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={panel} className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobil navigáció / Mobile">
          <ul className="mobile-menu__links">
            {sections.map((id, i) => (
              <li key={id} style={{ '--i': i } as React.CSSProperties}>
                <a href={`#${id}`} onClick={close}>
                  <NailMark size={26} color={menuColors[i % menuColors.length]} />
                  {t.nav[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__foot">
          <a className="btn" href="#booking" onClick={close}>
            {t.hero.cta}
          </a>
          <div className="mobile-menu__row">
            <LanguageSwitch />
            <a className="icon-link" href={site.instagram.url} target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
              <span>{site.instagram.handle}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
