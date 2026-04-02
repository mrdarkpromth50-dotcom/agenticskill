// Main index file for agent-town-i18n exports

export {
  // Config
  I18N_NAMESPACE,
  SupportedLocale,
  DEFAULT_LOCALE,
  Messages,
  LocaleMetadata,
  LocaleOptions,
  LOCALE_STORAGE_KEY,
  TRANSLATION_CACHE_KEY,
  DateTimeFormats,
  NumberFormats,
} from './config';

export type { I18nIntegrationGuide } from './INTEGRATION_GUIDE';

// Thai Formatter utilities
export {
  formatNumber,
  toThaiDigits,
  fromThaiDigits,
  formatDateTHAI,
  formatTimeTHAI,
  formatRelativeTimeTHAI,
  formatCompactTHAI,
  containsThaiCharacters,
  detectLanguage,
  formatModelLabel,
  ThaiCursorSymbols,
  ThaiPunctuation,
} from './utils/thai-formatter';

// Thai Keyboard utilities
export {
  ThaiIMEHandler,
  ThaiKeyboardLayout,
  ThaiVowelPlacement,
  ThaiToneMark,
  isThaiCharacter,
  isThaiString,
  romanToThaiKeyboard,
  formatThaiInput,
  findThaiWordBoundaries,
  truncateThaiText,
  wrapThaiRTL,
  ThaiToLatin,
  searchThaiText,
} from './utils/thai-keyboard';

// i18n Hooks
export {
  useI18n,
  initI18n,
  getLocale,
  getStoredLocale,
  detectBrowserLocale,
  initI18nAuto,
  createKey,
  type TranslationKey,
} from './utils/i18n-hook';

// Type exports
export type { I18nContextType } from './utils/i18n-hook';
