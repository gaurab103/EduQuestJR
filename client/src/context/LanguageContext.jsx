/**
 * Language context — English, Spanish, Nepali.
 * Used for Buddy Bear chat, speech synthesis, and UI.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'eduquest_lang';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
];

const SPEECH_LANG = { en: 'en-US', es: 'es-ES', ne: 'ne-NP' };

const LanguageCtx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
  }, [lang]);

  const setLang = useCallback((code) => {
    if (['en', 'es', 'ne'].includes(code)) setLangState(code);
  }, []);

  const speechLang = SPEECH_LANG[lang] || 'en-US';

  const value = {
    lang,
    setLang,
    languages: LANGUAGES,
    speechLang,
  };

  return (
    <LanguageCtx.Provider value={value}>
      {children}
    </LanguageCtx.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageCtx);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      languages: LANGUAGES,
      speechLang: 'en-US',
    };
  }
  return ctx;
}
