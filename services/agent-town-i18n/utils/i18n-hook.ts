// i18n Hook Implementation for React Components

import { useCallback, useMemo } from 'react';

interface I18nContextType {
  locale: 'en' | 'th';
  setLocale: (locale: 'en' | 'th') => void;
  messages: Record<string, any>;
  t: (key: string, defaultValue?: string) => string;
  date: (date: Date, format?: 'short' | 'long') => string;
  time: (date: Date) => string;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
}

// Mock context - in real implementation, this would use React Context
let globalLocale: 'en' | 'th' = 'en';
let globalMessages: Record<string, any> = {};

/**
 * Hook to use translations in React components
 * Usage:
 * const { t, locale } = useI18n();
 * <span>{t('ui.buttons.send')}</span>
 */
export function useI18n(): I18nContextType {
  const getNestedValue = useCallback(
    (obj: Record<string, any>, path: string): string => {
      const keys = path.split('.');
      let value = obj;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return path; // Return key path if not found
        }
      }

      return typeof value === 'string' ? value : String(value);
    },
    []
  );

  const translation = useCallback(
    (key: string, defaultValue: string = key): string => {
      return (
        getNestedValue(globalMessages, key) ||
        defaultValue
      );
    },
    [getNestedValue]
  );

  return useMemo(
    () => ({
      locale: globalLocale,
      setLocale: (locale: 'en' | 'th') => {
        globalLocale = locale;
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('agent-town-locale', locale);
        }
      },
      messages: globalMessages,
      t: translation,
      date: (date: Date) => date.toLocaleDateString(globalLocale),
      time: (date: Date) => date.toLocaleTimeString(globalLocale),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(
          globalLocale === 'th' ? 'th-TH' : 'en-US',
          options
        ).format(value),
    }),
    []
  );
}

/**
 * Initialize i18n with provided messages
 */
export function initI18n(
  locale: 'en' | 'th',
  messages: Record<string, any>
): void {
  globalLocale = locale;
  globalMessages = messages;

  // Persist locale preference
  if (typeof window !== 'undefined') {
    localStorage.setItem('agent-town-locale', locale);
  }
}

/**
 * Get current locale
 */
export function getLocale(): 'en' | 'th' {
  return globalLocale;
}

/**
 * Get stored locale preference from localStorage
 */
export function getStoredLocale(): 'en' | 'th' | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('agent-town-locale');
  return stored === 'th' || stored === 'en' ? stored : null;
}

/**
 * Detect browser language and return appropriate locale
 */
export function detectBrowserLocale(): 'en' | 'th' {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language?.toLowerCase() || 'en';
  return browserLang.startsWith('th') ? 'th' : 'en';
}

/**
 * Initialize i18n with auto-detection
 */
export function initI18nAuto(
  enMessages: Record<string, any>,
  thMessages: Record<string, any>
): void {
  // Priority: localStorage > browser language > default to English
  const stored = getStoredLocale();
  const browserLocale = detectBrowserLocale();
  const locale = stored || browserLocale;

  const messages = locale === 'th' ? thMessages : enMessages;
  initI18n(locale, messages);
}

/**
 * Type-safe translation keys with autocomplete
 * Usage: const key = createKey('ui.buttons.send') as TranslationKey
 */
export type TranslationKey = string & { readonly __brand: 'TranslationKey' };

export function createKey(key: string): TranslationKey {
  return key as TranslationKey;
}
