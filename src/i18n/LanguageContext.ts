import { createContext, useContext } from 'react';
import type { Dictionary } from './hu';

export const languages = ['hu', 'en'] as const;
export type Lang = (typeof languages)[number];

export interface LanguageContextValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>');
  return ctx;
}
