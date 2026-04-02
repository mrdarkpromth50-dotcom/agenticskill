// Integration Guide for Agent Town Thai Localization

import type { Messages, I18N_NAMESPACE } from './config';
import type { SupportedLocale } from './config';

/**
 * STEP 1: Install next-intl in Agent Town Project
 * 
 * Run in agent-town directory:
 * npm install next-intl
 * npm install -D @types/next-intl
 */

/**
 * STEP 2: Set up i18n in next.config.ts
 * 
 * import createNextIntlPlugin from 'next-intl/plugin';
 * 
 * const withNextIntl = createNextIntlPlugin();
 * 
 * export default withNextIntl({
 *   // Your Next.js config
 * });
 */

/**
 * STEP 3: Update app/layout.tsx to support multiple locales
 * 
 * import { ReactNode } from 'react';
 * import { notFound } from 'next/navigation';
 * import { getMessages } from 'next-intl/server';
 * import { SupportedLocale } from '@/i18n/config';
 * 
 * export function generateStaticParams() {
 *   return [{ locale: 'en' }, { locale: 'th' }];
 * }
 * 
 * export default async function RootLayout({
 *   children,
 *   params,
 * }: {
 *   children: ReactNode;
 *   params: { locale: string };
 * }) {
 *   const locale = params.locale as SupportedLocale;
 *   
 *   if (!['en', 'th'].includes(locale)) {
 *     notFound();
 *   }
 * 
 *   const messages = await getMessages();
 * 
 *   return (
 *     <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
 *       <NextIntlClientProvider locale={locale} messages={messages}>
 *         <body>{children}</body>
 *       </NextIntlClientProvider>
 *     </html>
 *   );
 * }
 */

/**
 * STEP 4: Copy locale files to agent-town
 * 
 * Copy from agenticskill/services/agent-town-i18n/locales/
 * To agent-town/public/locales/
 * 
 * Your locales structure should be:
 * public/
 *   └── locales/
 *       ├── en/
 *       │   └── messages.json
 *       └── th/
 *           └── messages.json
 */

/**
 * STEP 5: Use translations in React components
 * 
 * Examples:
 */

// Example 1: In a Client Component
/*
'use client';

import { useTranslations } from 'next-intl';
import { useI18n } from '@/i18n/hooks/useI18n';

export function ChatPanel() {
  const t = useTranslations();
  const { locale } = useI18n();

  return (
    <div>
      <h2>{t('ui.panels.chat')}</h2>
      <input 
        placeholder={t('ui.placeholders.messageInput')}
        type="text"
      />
      <button>{t('ui.buttons.send')}</button>
    </div>
  );
}
*/

// Example 2: With Thai Formatting
/*
import { formatDateTHAI, formatTimeTHAI } from '@/i18n/utils/thai-formatter';
import { useTranslations } from 'next-intl';

export function TaskDisplay({ task }: { task: Task }) {
  const t = useTranslations();
  const createdDate = formatDateTHAI(new Date(task.createdAt));

  return (
    <div>
      <p>{t('ui.labels.status')}: {t(`taskStatus.${task.status}`)}</p>
      <p>Created: {createdDate}</p>
    </div>
  );
}
*/

// Example 3: With Locale Switcher
/*
'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { LocaleOptions } from '@/i18n/config';

export function LocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <select
      value={locale}
      onChange={(e) => router.push(`/${e.target.value}`)}
    >
      {LocaleOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
*/

/**
 * STEP 6: Create middleware for locale detection
 * 
 * Create middleware.ts in project root:
 */

/*
import createMiddleware from 'next-intl/middleware';
import { SupportedLocale } from './i18n/config';

export default createMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
*/

/**
 * STEP 7: Update existing hardcoded strings
 * 
 * Locations to update:
 * - components/hud/ChatPanel.tsx
 * - components/hud/TaskPanel.tsx
 * - components/hud/WorkerPanel.tsx
 * - components/hud/ConnectionPanel.tsx
 * - components/hud/SeatManagerModal.tsx
 * - components/hud/OnboardingOverlay.tsx
 * - lib/constants.ts
 * - components/game/GameErrorBoundary.tsx
 * 
 * Replace hardcoded strings with t() calls
 */

/**
 * STEP 8: Add Thai keyboard support
 * 
 * In ChatPanel or any text input component:
 */

/*
import { ThaiIMEHandler, formatThaiInput } from '@/i18n/utils/thai-keyboard';

const imeHandler = new ThaiIMEHandler();

<input
  onCompositionStart={() => imeHandler.onCompositionStart()}
  onCompositionEnd={(e) => {
    const formatted = formatThaiInput(e.currentTarget.value);
    e.currentTarget.value = formatted;
  }}
  onChange={(e) => {
    if (!imeHandler.isCompositionActive()) {
      e.currentTarget.value = formatThaiInput(e.currentTarget.value);
    }
  }}
/>
*/

/**
 * STEP 9: Environment setup
 * 
 * Add to .env.local or deployment config:
 * NEXT_PUBLIC_LOCALE=th  # Default to Thai
 */

/**
 * STEP 10: Test Thai language support
 * 
 * - Start dev server: npm run dev
 * - Navigate to /?locale=th
 * - Verify all UI text is in Thai
 * - Test Thai keyboard input
 * - Check date/time formatting
 * - Test locale persistence
 */

export interface I18nIntegrationGuide {
  steps: string[];
  files: string[];
  components: string[];
  utilities: string[];
}

export const integrationGuide: I18nIntegrationGuide = {
  steps: [
    'Install next-intl package',
    'Update next.config.ts',
    'Update app/layout.tsx',
    'Copy locale files',
    'Use translations in components',
    'Create middleware',
    'Update hardcoded strings',
    'Add Thai keyboard support',
    'Environment configuration',
    'Test localization',
  ],
  files: [
    'next.config.ts',
    'middleware.ts',
    'app/layout.tsx',
    'public/locales/en/messages.json',
    'public/locales/th/messages.json',
    '.env.local',
  ],
  components: [
    'components/hud/ChatPanel.tsx',
    'components/hud/TaskPanel.tsx',
    'components/hud/WorkerPanel.tsx',
    'components/LocaleSwitcher.tsx (new)',
  ],
  utilities: [
    'lib/i18n/config.ts',
    'lib/i18n/utils/thai-formatter.ts',
    'lib/i18n/utils/thai-keyboard.ts',
    'lib/i18n/utils/i18n-hook.ts',
  ],
};
