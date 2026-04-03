'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SupportedLocale } from '../config';

/**
 * Client-side hook for managing locale preference
 * Reads from and writes to cookie for server-side rendering support
 */
export function useLocalePreference() {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Read locale from cookie on mount
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LOCALE_STORAGE_KEY}=`))
      ?.split('=')[1];
    
    if (cookieValue && Object.values(SupportedLocale).includes(cookieValue as SupportedLocale)) {
      setLocaleState(cookieValue as SupportedLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    // Write to cookie (1 year expiry)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${LOCALE_STORAGE_KEY}=${newLocale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    setLocaleState(newLocale);
    // Reload page to apply new locale (server-side rendering)
    window.location.reload();
  }, []);

  return { locale, setLocale };
}
