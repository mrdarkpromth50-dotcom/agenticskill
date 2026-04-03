import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SupportedLocale } from './config';

export default getRequestConfig(async () => {
  // Read locale from cookie (set by LocaleSwitcher component)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  
  // Validate locale
  const locale = (localeCookie && Object.values(SupportedLocale).includes(localeCookie as SupportedLocale))
    ? (localeCookie as SupportedLocale)
    : DEFAULT_LOCALE;

  const messages = (await import(`../../public/locales/${locale}/messages.json`)).default;

  return {
    locale,
    messages,
  };
});
