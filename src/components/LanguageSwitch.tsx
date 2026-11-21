import { languages, useI18n } from '../i18n/LanguageContext';
import './LanguageSwitch.css';

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t.nav.language}>
      {languages.map((code, i) => (
        <span key={code} className="lang-switch__item">
          {i > 0 && <span className="lang-switch__sep" aria-hidden="true" />}
          <button
            type="button"
            className="lang-switch__btn"
            aria-pressed={lang === code}
            lang={code}
            aria-label={code === 'hu' ? 'Magyar' : 'English'}
            onClick={() => setLang(code)}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
