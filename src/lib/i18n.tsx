import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { en } from './translations/en';
import { kk } from './translations/kk';
import { ru } from './translations/ru';

export type Language = 'ru' | 'en' | 'kk';
type TranslationKey = keyof typeof ru;

type I18nContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, kk, ru };
const localeByLanguage: Record<Language, string> = { en: 'en-US', kk: 'kk-KZ', ru: 'ru-RU' };
const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLanguage(): Language {
  const saved = localStorage.getItem('language');
  if (saved === 'en' || saved === 'kk' || saved === 'ru') return saved;
  return 'ru';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  function setLanguage(nextLanguage: Language) {
    localStorage.setItem('language', nextLanguage);
    setLanguageState(nextLanguage);
  }

  const value = useMemo<I18nContextValue>(() => {
    function t(key: TranslationKey, params: Record<string, string | number> = {}) {
      const template = dictionaries[language][key] ?? dictionaries.ru[key];
      return Object.entries(params).reduce(
        (result, [name, paramValue]) => result.replace(`{${name}}`, String(paramValue)),
        template,
      );
    }

    return { language, locale: localeByLanguage[language], setLanguage, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
