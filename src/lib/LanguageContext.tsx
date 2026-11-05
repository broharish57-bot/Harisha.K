import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Language, type Translations, translations } from './i18n.ts';
import { getStoredLanguage, setStoredLanguage } from './api.ts';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => getStoredLanguage());

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    setStoredLanguage(newLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t: translations[lang] || translations.en }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
