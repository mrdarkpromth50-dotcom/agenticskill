// i18n Configuration for Agent Town
// Adapted from @agenticskill/agent-town-i18n

export const I18N_NAMESPACE = 'agent-town';

export enum SupportedLocale {
  English = 'en',
  Thai = 'th',
}

export const DEFAULT_LOCALE = SupportedLocale.English;

export const LOCALE_STORAGE_KEY = `${I18N_NAMESPACE}-locale`;

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

export const LocaleOptions = Object.entries(LocaleMetadata).map(
  ([locale, meta]) => ({
    value: locale as SupportedLocale,
    label: meta.nativeName,
    name: meta.name,
  })
);

export const locales = Object.values(SupportedLocale);
