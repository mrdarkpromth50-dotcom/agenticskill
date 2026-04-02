// I18n Configuration for Agent Town

import enMessages from '../locales/en/messages.json';
import thMessages from '../locales/th/messages.json';

/**
 * Namespace for all i18n configuration
 */
export const I18N_NAMESPACE = 'agent-town';

/**
 * Supported locales
 */
export enum SupportedLocale {
  English = 'en',
  Thai = 'th',
}

/**
 * Default locale
 */
export const DEFAULT_LOCALE = SupportedLocale.English;

/**
 * All available messages by locale
 */
export const Messages: Record<SupportedLocale, typeof enMessages> = {
  [SupportedLocale.English]: enMessages,
  [SupportedLocale.Thai]: thMessages,
};

/**
 * Locale metadata
 */
export const LocaleMetadata: Record<
  SupportedLocale,
  { name: string; nativeName: string; rtl: boolean; region: string }
> = {
  [SupportedLocale.English]: {
    name: 'English',
    nativeName: 'English',
    rtl: false,
    region: 'US',
  },
  [SupportedLocale.Thai]: {
    name: 'Thai',
    nativeName: 'ไทย',
    rtl: false,
    region: 'TH',
  },
};

/**
 * Language selector options for UI
 */
export const LocaleOptions = Object.entries(LocaleMetadata).map(
  ([locale, meta]) => ({
    value: locale,
    label: meta.nativeName,
    name: meta.name,
  })
);

/**
 * Storage key for locale preference
 */
export const LOCALE_STORAGE_KEY = `${I18N_NAMESPACE}-locale`;

/**
 * Storage key for translation cache
 */
export const TRANSLATION_CACHE_KEY = `${I18N_NAMESPACE}-cache`;

/**
 * i18n Next.js Configuration
 * Use this in next.config.ts for SSR support
 */
export const NextIntlConfig = {
  locales: Object.values(SupportedLocale),
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: true,
};

/**
 * Date/Time format options by locale
 */
export const DateTimeFormats = {
  [SupportedLocale.English]: {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
    },
  },
  [SupportedLocale.Thai]: {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    },
    time: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    },
  },
};

/**
 * Number format options by locale
 */
export const NumberFormats = {
  [SupportedLocale.English]: {
    currency: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 0,
    },
  },
  [SupportedLocale.Thai]: {
    currency: {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 0,
    },
  },
};
