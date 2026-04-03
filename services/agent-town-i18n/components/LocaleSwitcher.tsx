'use client';

import { useLocalePreference } from '@/lib/i18n/utils/use-locale';
import { LocaleOptions, SupportedLocale } from '@/lib/i18n/config';

/**
 * LocaleSwitcher - Dropdown component for switching between Thai and English
 * Appears in the HUD settings area
 */
export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocalePreference();

  return (
    <div className="locale-switcher" title="เปลี่ยนภาษา / Change Language">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        className="locale-switcher__select"
        aria-label="Language / ภาษา"
      >
        {LocaleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
