# Thai Language Support for Agent Town

🇹🇭 **ภาษาไทย (Thai Language) Complete Implementation Guide**

---

## 📦 What's Included

This package provides **complete Thai language support** for the Agent Town project (Agent Town is part of the AgenticSkill system).

### Components:
```
services/agent-town-i18n/
├── locales/                    # Translation files
│   ├── en/messages.json        # English (120+ strings)
│   └── th/messages.json        # Thai ไทย (120+ strings)
├── utils/
│   ├── thai-formatter.ts       # Date/time/number formatting
│   ├── thai-keyboard.ts        # Thai input & IME support
│   └── i18n-hook.ts            # React integration hooks
├── config.ts                   # Configuration
├── INTEGRATION_GUIDE.md        # How to integrate
└── README.md                   # Package documentation
```

---

## 🎯 Supported Languages

| Locale | Language | Status | Coverage |
|--------|----------|--------|----------|
| **en** | English (US) | ✅ Complete | 100% |
| **th** | Thai (ไทย) | ✅ Complete | 100% |

---

## ✨ Features

### 1. **Complete UI Translation** (120+ strings)
- ✅ All UI buttons translated
- ✅ Panel labels and titles
- ✅ Error messages
- ✅ Status indicators
- ✅ Onboarding tutorial
- ✅ In-game activities
- ✅ Role presets

### 2. **Thai-Specific Formatting**
- 📅 Thai date format: "2 เมษายน 2569" (Buddhist Era)
- ⏰ Thai time format: "14:30 น."
- 🔢 Thai number formatting: "1,000"
- 🔤 Thai digit conversion: 1234 → ๑๒๓๔
- ⏱️ Relative time: "5 นาทีที่แล้ว" (5 minutes ago)

### 3. **Thai Keyboard Support**
- ⌨️ Thai IME (Input Method Editor) handling
- 🗣️ Thai keyboard layout mapping
- 📝 Thai text input formatting
- 🎯 Thai word breaking detection
- ✓ Thai character validation

### 4. **React Integration**
- 🪝 Custom `useI18n()` hook
- 💾 Locale persistence (localStorage)
- 🌍 Browser language auto-detection
- 🔄 Locale switching without reload
- 📱 Next.js 16 compatible

---

## 🚀 Quick Start for Agent Town

### Prerequisites:
- Agent Town project (Next.js 16)
- Node.js 20+
- npm or pnpm

### 5-Minute Setup:

```bash
# 1. Copy package to your agent-town project
cp -r services/agent-town-i18n ../agent-town/lib/i18n

# 2. Install dependency
cd ../agent-town
npm install next-intl

# 3. Copy locale files to public folder
mkdir -p public/locales/en public/locales/th
cp lib/i18n/locales/en/messages.json public/locales/en/
cp lib/i18n/locales/th/messages.json public/locales/th/

# 4. Update next.config.ts (see INTEGRATION_GUIDE.md for code)

# 5. Start dev server
npm run dev

# 6. Test Thai - Visit: http://localhost:3000/th
```

**For detailed integration:** See `services/agent-town-i18n/INTEGRATION_GUIDE.md`

---

## 📝 Translation Examples

### English vs Thai

| Component | English | Thai |
|-----------|---------|------|
| **App Title** | "Agent Town" | "Agent Town" |
| **Status** | "Online" | "ออนไลน์" |
| **Button** | "Send" | "ส่ง" |
| **Empty State** | "No tasks yet." | "ยังไม่มีงาน" |
| **Error** | "Connection failed" | "การเชื่อมต่อล้มเหลว" |
| **Date** | "April 2, 2026" | "2 เมษายน 2569" |
| **Time** | "2:30:45 PM" | "14:30:45 น." |

---

## 🎓 Usage Examples

### 1. In React Components:
```tsx
import { useI18n } from '@/i18n/utils/i18n-hook';

export function ChatPanel() {
  const { t, locale } = useI18n();
  
  return (
    <div>
      <h2>{t('ui.panels.chat')}</h2>
      <button>{t('ui.buttons.send')}</button>
      <p>Current language: {locale} 🌍</p>
    </div>
  );
}
```

### 2. Thai Date Formatting:
```tsx
import { formatDateTHAI, formatTimeTHAI } from '@/i18n/utils/thai-formatter';

const date = new Date('2026-04-02');
console.log(formatDateTHAI(date));     // "2 เมษายน 2569"
console.log(formatTimeTHAI(date));     // "00:00 น."
```

### 3. Thai Keyboard Input:
```tsx
import { formatThaiInput, isThaiCharacter } from '@/i18n/utils/thai-keyboard';

const input = "สวัสดี";
console.log(isThaiCharacter(input[0])); // true
console.log(formatThaiInput(input));    // "สวัสดี" (normalized)
```

### 4. Locale Switching:
```tsx
import { useI18n } from '@/i18n/utils/i18n-hook';

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  
  return (
    <>
      <button onClick={() => setLocale('en')}>English</button>
      <button onClick={() => setLocale('th')}>ไทย (Thai)</button>
      <p>Active: {locale}</p>
    </>
  );
}
```

---

## 📋 Translation Coverage

### Status Messages
- ✅ Connection status (Online/Offline/Connecting/Error)
- ✅ Seat status (Empty/Running/Done/Failed)
- ✅ Task status (Queued/Running/Completed)

### UI Components
- ✅ Panel titles: Chat, Tasks, Workers, Connection, Settings
- ✅ Buttons: Send, Save, Close, Connect, Disconnect
- ✅ Input placeholders and labels
- ✅ Empty states and error messages

### In-Game Elements
- ✅ POI activities (water cooler, printer, meeting room, etc.)
- ✅ Worker activities (sleep, stretch, code, think, celebrate)
- ✅ Role presets (Frontend, Backend, Designer, etc.)
- ✅ Interaction prompts

### Formatting
- ✅ Dates (Thai calendar/Buddhist Era)
- ✅ Times (with Thai "น." suffix)
- ✅ Numbers (grouped separators)
- ✅ Relative time ("5 minutes ago" format)

---

## 🔧 Utility Functions

### Thai Formatter (`utils/thai-formatter.ts`)
```typescript
formatNumber(value, locale)              // Number formatting
toThaiDigits(value)                      // Convert to Thai digits
fromThaiDigits(value)                    // Convert from Thai digits
formatDateTHAI(date, format)             // Thai date (Buddhist Era)
formatTimeTHAI(date)                     // Thai time format
formatCompactTHAI(text, maxLength)       // Smart Thai text truncation
containsThaiCharacters(text)             // Check if contains Thai
detectLanguage(text)                     // Detect language from text
```

### Thai Keyboard (`utils/thai-keyboard.ts`)
```typescript
isThaiCharacter(char)                    // Character validation
isThaiString(str)                        // String validation
romanToThaiKeyboard(text)                // Convert Roman to Thai layout
formatThaiInput(text)                    // Normalize Thai input
truncateThaiText(text, maxLength)        // Word-aware truncation
searchThaiText(haystack, needle)         // Search with Roman support
```

### i18n Hook (`utils/i18n-hook.ts`)
```typescript
useI18n()                                // Main hook
initI18n(locale, messages)               // Initialize
getLocale()                              // Get current locale
detectBrowserLocale()                    // Detect from browser
initI18nAuto(enMsg, thMsg)               // Auto-initialize
```

---

## 📂 File Locations

In your Agent Town project after integration:

```
agent-town/
├── lib/
│   └── i18n/
│       ├── utils/
│       │   ├── thai-formatter.ts
│       │   ├── thai-keyboard.ts
│       │   └── i18n-hook.ts
│       ├── config.ts
│       └── index.ts
├── public/
│   └── locales/
│       ├── en/
│       │   └── messages.json
│       └── th/
│           └── messages.json
└── middleware.ts                        # Locale detection middleware
```

---

## 🧪 Testing Thai Support

### Test Checklist:
- [ ] UI displays in Thai when locale=th
- [ ] Thai date format shows "เมษายน 2569" (not April 2026)
- [ ] Thai time shows "น." suffix
- [ ] Thai keyboard input works
- [ ] Locale persists after page reload
- [ ] Browser language auto-detects Thai
- [ ] Switching locale updates all UI
- [ ] Error messages show in correct language
- [ ] Empty states display in correct language
- [ ] Number formatting uses correct separators

### Test URLs:
```
http://localhost:3000              # English (default)
http://localhost:3000/th           # Thai locale
http://localhost:3000/?locale=th   # Query param fallback
```

---

## 🌐 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Excellent Thai support |
| Safari | ✅ Full | iOS & macOS |
| Edge | ✅ Full | Based on Chrome |
| Mobile | ✅ Full | iOS & Android both work |

---

## 📚 Documentation Files

- **README.md** (this file) - Overview and examples
- **INTEGRATION_GUIDE.md** - Step-by-step integration (10 steps)
- **services/agent-town-i18n/README.md** - Package details
- **Code comments** - Inline documentation in TypeScript files

---

## 🎨 Locales Included

### English (en)
- Default locale
- US English formatting
- 120+ translated strings

### Thai (ไทย - th)
- Full Thai localization
- Buddhist Era dates (add 543 to year)
- Thai-specific formatting
- 120+ Thai translations

---

## 🚀 Next Steps

1. **Quick Integrate:** Follow 5-minute setup above
2. **Full Integration:** Read `INTEGRATION_GUIDE.md` (10 detailed steps)
3. **Test:** Verify all UI text in Thai
4. **Deploy:** Include with Agent Town
5. **Expand:** Add more languages later

---

## 🛠️ Troubleshooting

### Thai text not displaying?
- Check fonts are loaded: `ArkPixel`, `Tahoma`, system fonts
- Verify `<html lang="th">` is set
- Clear browser cache

### Locale not switching?
- Check middleware.ts is configured
- Verify localStorage key is correct
- Test in incognito/private window

### Thai IME not working?
- Ensure Thai IME hook is added to input components
- Test with native Thai keyboard layout installed
- Try different browser

### Date format showing English?
- Use `formatDateTHAI()` instead of standard formatter
- Verify locale parameter is 'th'
- Check Buddhist Era calculation (year + 543)

---

## 🤝 Contributing

Want to add more languages or improve Thai translations?

1. Add translations to `locales/[lang]/messages.json`
2. Add formatting utilities if needed
3. Test thoroughly
4. Submit PR

---

## 📞 Support

- Check documentation in `services/agent-town-i18n/`
- Review integration guide for setup
- File issues on GitHub repository
- Check existing translations for patterns

---

## ✅ Production Ready

- ✅ 120+ UI strings translated
- ✅ Complete Thai formatting utilities
- ✅ Thai keyboard/IME support
- ✅ React hooks integration
- ✅ next-intl compatible
- ✅ localStorage persistence
- ✅ Browser detection
- ✅ Type-safe implementation
- ✅ Zero external dependencies (except next-intl)
- ✅ Tested & documented

---

## 📝 License

MIT - Same as Agent Town and AgenticSkill

---

## 🎉 Summary

This package provides **everything needed** to add Thai language support to Agent Town:

- ✅ 120+ UI strings translated
- ✅ Thai-specific formatting (dates, numbers, times)
- ✅ Thai keyboard & IME support
- ✅ React integration hooks
- ✅ Production-ready code
- ✅ Comprehensive documentation

**Ready to integrate!** 🚀

---

**Created:** April 2, 2026  
**Support Languages:** English, Thai (ไทย)  
**Project:** AgenticSkill → Agent Town  
**License:** MIT
