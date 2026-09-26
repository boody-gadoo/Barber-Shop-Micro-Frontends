import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language } from '@shared-types/core';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps): JSX.Element {
  const [language, setLanguageState] = useState<Language>(Language.ENGLISH);

  // Initialize language from localStorage or browser locale
  useEffect(() => {
    const stored = localStorage.getItem('language');
    if (stored === Language.ENGLISH || stored === Language.ARABIC) {
      setLanguageState(stored);
    } else {
      const browserLang = navigator.language.split('-')[0];
      setLanguageState(browserLang === 'ar' ? Language.ARABIC : Language.ENGLISH);
    }
  }, []);

  // Apply language and direction to document
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === Language.ARABIC ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = (): void => {
    setLanguageState((prev: Language) => (prev === Language.ENGLISH ? Language.ARABIC : Language.ENGLISH));
  };

  const setLanguage = (lang: Language): void => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
