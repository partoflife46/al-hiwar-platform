'use client';

/**
 * Shared platform module for language context utilities and configuration.
 * Exports typed helpers consumed across the Al-Hiwar web application.
 * @module lib/context/language-context
 * @exports LanguageProvider, useLanguage
 */

import * as React from 'react';
import type { SupportedLanguage } from '@/lib/db/types';

/**
 * Type contract defining language context type.
 * Includes fields/members: language, setLanguage, isFr.
 */
interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isFr: boolean;
}

const LanguageContext = React.createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  isFr: false,
});

/**
 * Constant definition for storage key.
 */
const STORAGE_KEY = 'alhiwar_language';

/**
 * Renders the language provider interface component.
 * @param props - Destructured input containing children.
 * @returns Rendered JSX element tree.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<SupportedLanguage>('en');

  // Initialize from localStorage or cookie on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved === 'en' || saved === 'fr') {
        setLanguageState(saved);
        return;
      }
      // Check document cookie
      const match = document.cookie.match(/alhiwar_lang=(en|fr)/);
      if (match && (match[1] === 'en' || match[1] === 'fr')) {
        setLanguageState(match[1]);
      }
    } catch {
      // ignore
    }
  }, []);

  /**
   * Memoized handler/selector for set language.
   */
  const setLanguage = React.useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
      }
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `alhiwar_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent('alhiwar:language-changed', { detail: newLang }));
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Listen to external language change events
  React.useEffect(() => {
    /**
     * Executes handle lang change logic.
     * @param e - E value (`Event`).
     */
    const handleLangChange = (e: Event) => {
      const detail = (e as CustomEvent<SupportedLanguage>).detail;
      if (detail === 'en' || detail === 'fr') {
        setLanguageState(detail);
      }
    };
    window.addEventListener('alhiwar:language-changed', handleLangChange);
    return () => window.removeEventListener('alhiwar:language-changed', handleLangChange);
  }, []);

  /**
   * Memoized handler/selector for value.
   */
  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      isFr: language === 'fr',
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * React hook managing language state and lifecycle effects.
 * @returns Value of type `LanguageContextType`.
 */
export function useLanguage(): LanguageContextType {
  return React.useContext(LanguageContext);
}
