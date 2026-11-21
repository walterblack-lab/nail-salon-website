import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import hu, { type Dictionary } from './hu';
import en from './en';
import { LanguageContext, type Lang } from './LanguageContext';

const dictionaries: Record<Lang, Dictionary> = { hu, en };
const STORAGE_KEY = 'mira-lang';

function initialLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'hu' || fromUrl === 'en') return fromUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'hu' || stored === 'en') return stored;
  } catch {
    /* storage unavailable: fall through to the default */
  }
  return 'hu';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const t = dictionaries[lang];

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    if (next === 'hu') url.searchParams.delete('lang');
    else url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }, []);

  // Keep <html lang>, the title and the meta description in sync for SEO and screen readers.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'hu' ? 'hu_HU' : 'en_GB');
  }, [lang, t]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
