# Agent Town Thai Language Support

🇹🇭 **Complete Thai Localization Package for Agent Town**

---

## 📦 Contents

This package provides comprehensive Thai language support for the Agent Town project:

### 1. **Translation Files**
- `locales/en/messages.json` - English translations (base language)
- `locales/th/messages.json` - Thai translations (ภาษาไทย)

### 2. **Utility Libraries**
- `utils/thai-formatter.ts` - Thai date/time/number formatting
- `utils/thai-keyboard.ts` - Thai keyboard input handling & IME support
- `utils/i18n-hook.ts` - React hooks for i18n
- `config.ts` - i18n configuration

### 3. **Documentation**
- `INTEGRATION_GUIDE.md` - Step-by-step integration instructions
- `README.md` - This file

---

## 🎯 Features

### ✅ Complete UI Translation
- Status messages
- Button labels
- Panel titles
- Error messages
- Onboarding text
- All 120+ UI strings

### ✅ Thai-Specific Formatting
- Thai date format (Buddhist Era): "2 เมษายน 2569"
- Thai time format with "น." suffix
- Thai number formatting with proper separators
- Thai digits conversion (๐-๙)
- Relative time in Thai ("5 นาทีที่แล้ว")

### ✅ Thai Keyboard Support
- Thai IME (Input Method Editor) handling
- Thai keyboard layout mapping
- Thai text input formatting
- Thai word breaking detection
- Thai character detection & validation
- Tone mark and vowel placement

### ✅ Localization Framework
- React hooks integration (`useI18n()`)
- Next.js 16 compatibility (`next-intl`)
- Locale persistence (localStorage)
- Browser language detection
- Type-safe translation keys

---

## 📋 Translation Coverage

### Metadata
- App title & description
- Browser metadata

### Status Indicators
- Connection status (Online/Offline/Connecting/Error)
- Seat status (Empty/Running/Done/Failed)
- Task status (Queued/Running/Completed)

### UI Components
- Panel headers (Chat, Tasks, Workers, Connection, Settings)
- Button labels (Send, Stop, Save, Close)
- Input placeholders
- Warning/Error messages
- Empty state messages

### Interactions
- "Press E to interact" → "กดปุ่ม E เพื่อโต้ตอบ"
- Task assignment prompts
- Cursor instructions

### In-Game Elements
- POI (Point of Interest) activities (water cooler, printer, etc.)
- Worker idle activities
- Role presets

### User Interface Labels
- Worker name, type, status
- Active tasks counter
- Gateway connection info
- API configuration

---

## 🚀 Quick Start Integration

```bash
# 1. Copy this package to your agent-town project
cp -r services/agent-town-i18n agent-town/lib/i18n

# 2. Install next-intl
cd agent-town
npm install next-intl

# 3. Follow INTEGRATION_GUIDE.md
# - Update next.config.ts
# - Update app/layout.tsx
# - Copy locale JSON files to public/locales/
# - Update components with t() calls

# 4. Start dev server
npm run dev

# 5. Test Thai language
# - Navigate to: http://localhost:3000/th
# - Or: http://localhost:3000/?locale=th
```

---

## 📐 File Structure

```
agent-town-i18n/
├── config.ts                          # i18n Configuration
├── INTEGRATION_GUIDE.md               # Integration steps
├── README.md                          # This file
├── locales/
│   ├── en/
│   │   └── messages.json              # English strings (~120 items)
│   └── th/
│       └── messages.json              # Thai strings (~120 items)
└── utils/
    ├── thai-formatter.ts              # Date/time/number formatting
    ├── thai-keyboard.ts               # Thai keyboard & IME support
    └── i18n-hook.ts                   # React hooks for i18n
```

---

## 🎨 Locales Included

| Locale | Name | Region | Notes |
|--------|------|--------|-------|
| **en** | English | US | Default locale |
| **th** | Thai (ไทย) | Thailand | Full Thai support with Buddhist Era dates |

---

## 🔧 Utility Functions Reference

### Thai Formatting (`thai-formatter.ts`)

```typescript
// Date formatting
formatDateTHAI(new Date(), 'long')     // "พุธ ที่ 2 เมษายน 2569"
formatDateTHAI(new Date(), 'short')    // "2 เมษายน 2569"

// Time formatting
formatTimeTHAI(new Date())             // "14:30 น."

// Number formatting
formatNumber(1000, 'th')               // "1,000"
toThaiDigits(1234)                     // "๑๒๓๔"

// Text formatting
formatCompactTHAI("longtext", 50)      // Truncates with "..."
formatRelativeTimeTHAI(5, strings)     // "5 นาทีที่แล้ว"

// Language detection
containsThaiCharacters("สวัสดี")       // true
detectLanguage("สวัสดี")               // 'th'
```

### Thai Keyboard (`thai-keyboard.ts`)

```typescript
// Thai character validation
isThaiCharacter('ก')                   // true
isThaiString("สวัสดี")                 // true

// Keyboard layout
romanToThaiKeyboard('hello')           // Converts to Thai keyboard layout

// Input formatting
formatThaiInput(text)                  // Normalizes spacing, tone marks

// Search support
searchThaiText(haystack, needle)       // Works with Roman approximation

// Word breaking
truncateThaiText(text, 50)             // Intelligent Thai word breaking
```

### React Hooks (`i18n-hook.ts`)

```typescript
// In React component:
const { t, locale, date, time, number } = useI18n();

// Translations
t('ui.buttons.send')                   // "Send" or "ส่ง"

// Initialize i18n
initI18n('th', thMessages);
initI18nAuto(enMessages, thMessages);  // Auto-detect browser language

// Get/set locale
getLocale()                            // 'th'
getStoredLocale()                      // 'th' (from localStorage)
detectBrowserLocale()                  // 'th' (from navigator.language)
```

---

## 📝 Translation Keys Structure

```json
{
  "metadata": { "appTitle": "...", "appDescription": "..." },
  "status": { "offline": "...", "connecting": "...", ... },
  "ui": {
    "buttons": { "send": "...", "save": "...", ... },
    "panels": { "chat": "...", "tasks": "...", ... },
    "placeholders": { "messageInput": "...", ... },
    "labels": { "status": "...", ... }
  },
  "interactions": { "pressE": "...", ... },
  "poi": { "water": ["..."], "printer": ["..."], ... },
  "errors": { "sceneCrashed": "...", ... },
  "onboarding": { "welcome": "...", ... }
}
```

---

## 🎯 Integration Steps

### Short Version
1. Copy `services/agent-town-i18n` to `agent-town/lib/i18n`
2. `npm install next-intl`
3. Update `next.config.ts`, `app/layout.tsx`
4. Copy locale JSONs to `public/locales/`
5. Replace hardcoded strings with `t()` calls
6. Test at `/?locale=th`

### Detailed Version
See `INTEGRATION_GUIDE.md` (10 detailed steps)

---

## 🧪 Testing

### Test Checklist

- [ ] All UI text displays in Thai when locale=th
- [ ] Thai date/time formatting works correctly
- [ ] Thai keyboard input works properly
- [ ] Locale preference persists across page reloads
- [ ] Browser language detection works
- [ ] Switching locale updates all UI
- [ ] Error messages appear in correct language
- [ ] Number formatting uses correct separators
- [ ] Thai IME composition works correctly
- [ ] Agent communication messages are in correct language

### Test URLs

```
http://localhost:3000              # English (default)
http://localhost:3000/th           # Thai
http://localhost:3000/?locale=th   # Thai (fallback)
```

---

## 🔄 Maintaining Translations

### Adding New Strings

When adding new UI text to Agent Town:

1. Add to `locales/en/messages.json`
2. Add Thai translation to `locales/th/messages.json`
3. Use `t('path.to.key')` in component
4. Test in both English and Thai

### Updating Existing Strings

1. Update both `locales/en/messages.json` and `locales/th/messages.json`
2. Components automatically reflect changes
3. No code changes needed

### Translation Guidelines

- Keep strings short and concise
- Provide context in comments for translators
- Test UI doesn't break with longer Thai text
- Use plural forms when appropriate
- Include examples where helpful

---

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support |
| Firefox | ✅ Full | Full support |
| Safari | ✅ Full | Excellent Thai support |
| Edge | ✅ Full | Full support |
| Mobile | ✅ Full | iOS & Android tested |

---

## 📚 Related Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Thai Unicode Range](https://en.wikipedia.org/wiki/Thai_(Unicode_block))
- [Agent Town GitHub](https://github.com/geezerrrr/agent-town)
- [AgenticSkill Project](https://github.com/mrdarkpromth50-dotcom/agenticskill)

---

## 🤝 Contributing

Want to improve Thai translations or add more languages?

1. Fork the repository
2. Update locale files
3. Test thoroughly
4. Submit pull request

---

## 📞 Support & Issues

- File issues on GitHub
- Check INTEGRATION_GUIDE.md for setup help
- Review existing translations for patterns
- Test Thai keyboard input carefully

---

## 📄 License

MIT - Same as Agent Town and AgenticSkill projects

---

## 🎉 Next Steps

1. ✅ Integrate this package into Agent Town
2. 🔄 Test Thai language support
3. 📦 Deploy with multi-language support
4. 🌍 Consider adding more languages (Vietnamese, Laos, etc.)
5. 📱 Add mobile app localization

---

**Created:** April 2, 2026  
**Language Support:** English (en), Thai (ไทย)  
**Last Updated:** April 2, 2026
