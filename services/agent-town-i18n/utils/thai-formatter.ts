// Thai and English Number & Date Formatting Utilities

/**
 * Format numbers with Thai locale support
 * Examples:
 * - formatNumber(1000, 'en') -> "1,000"
 * - formatNumber(1000, 'th') -> "1,000"
 * - formatThaiNumber(1000) -> "1,000"
 */
export function formatNumber(
  value: number,
  locale: 'en' | 'th' = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const formatter = new Intl.NumberFormat(
    locale === 'th' ? 'th-TH' : 'en-US',
    {
      useGrouping: true,
      ...options,
    }
  );
  return formatter.format(value);
}

/**
 * Format Thai numbers with Thai digits
 * Example: 1234 -> "๑๒๓๔"
 */
export function toThaiDigits(value: number | string): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(value)
    .split('')
    .map(digit => {
      const num = parseInt(digit, 10);
      return isNaN(num) ? digit : thaiDigits[num];
    })
    .join('');
}

/**
 * Convert Thai digits back to Western digits
 * Example: "๑๒๓๔" -> "1234"
 */
export function fromThaiDigits(value: string): string {
  const thaiToEnglish: { [key: string]: string } = {
    '๐': '0',
    '๑': '1',
    '๒': '2',
    '๓': '3',
    '๔': '4',
    '๕': '5',
    '๖': '6',
    '๗': '7',
    '๘': '8',
    '๙': '9',
  };

  return value
    .split('')
    .map(char => thaiToEnglish[char] || char)
    .join('');
}

/**
 * Format date in Thai locale
 * Example: new Date('2026-04-02') -> "2 เมษายน 2569"
 */
export function formatDateTHAI(
  date: Date,
  format: 'short' | 'long' = 'short'
): string {
  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Buddhist Era

  if (format === 'short') {
    return `${day} ${month} ${year}`;
  }

  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dayName = days[date.getDay()];

  return `${dayName} ที่ ${day} ${month} ${year}`;
}

/**
 * Format time in Thai locale
 * Example: new Date() -> "14:30 น."
 */
export function formatTimeTHAI(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} น.`;
}

/**
 * Format relative time in Thai
 * Example: 5 minutes ago -> "5 นาทีที่แล้ว"
 */
export function formatRelativeTimeTHAI(
  minutes: number,
  thaiStrings: {
    now: string;
    minute: string;
    minutes: string;
    hour: string;
    hours: string;
    day: string;
    days: string;
  }
): string {
  if (minutes === 0) return thaiStrings.now;
  if (minutes === 1) return `1 ${thaiStrings.minute}`;
  if (minutes < 60) return `${minutes} ${thaiStrings.minutes}`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return `1 ${thaiStrings.hour}`;
  if (hours < 24) return `${hours} ${thaiStrings.hours}`;

  const days = Math.floor(hours / 24);
  if (days === 1) return `1 ${thaiStrings.day}`;
  return `${days} ${thaiStrings.days}`;
}

/**
 * Format compact text for Thai with proper spacing
 * Handles word breaking for better readability
 */
export function formatCompactTHAI(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;

  // For Thai text, find last space or suitable break point
  let breakPoint = maxLength;
  for (let i = maxLength; i > 0; i--) {
    if (text[i] === ' ' || text[i] === ',' || text[i] === '।') {
      breakPoint = i;
      break;
    }
  }

  return text.substring(0, breakPoint) + '...';
}

/**
 * Check if string contains Thai characters
 */
export function containsThaiCharacters(text: string): boolean {
  const thaiRegex = /[\u0E00-\u0E7F]/g;
  return thaiRegex.test(text);
}

/**
 * Detect language from text content
 * Returns 'th' for Thai, 'en' for English
 */
export function detectLanguage(text: string): 'th' | 'en' {
  const thaiRegex = /[\u0E00-\u0E7F]/g;
  const thaiMatches = (text.match(thaiRegex) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  return thaiMatches > totalChars * 0.3 ? 'th' : 'en';
}

/**
 * Format model label with language-specific formatting
 * Example: 'claude-3-5-sonnet' -> "Claude 3.5 Sonnet"
 */
export function formatModelLabel(
  modelId: string,
  locale: 'en' | 'th' = 'en'
): string {
  const thaiModelNames: { [key: string]: string } = {
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-sonnet-4-6-thinking': 'Claude Sonnet 4.6 (คิด)',
    'gemini-3-flash': 'Gemini 3 Flash',
    'gemini-2-pro': 'Gemini 2 Pro',
  };

  const englishModelNames: { [key: string]: string } = {
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-sonnet-4-6-thinking': 'Claude Sonnet 4.6 (Thinking)',
    'gemini-3-flash': 'Gemini 3 Flash',
    'gemini-2-pro': 'Gemini 2 Pro',
  };

  const names =
    locale === 'th' ? thaiModelNames : englishModelNames;
  return names[modelId] || modelId;
}

/**
 * Thai specific cursor text for CLI/Terminal
 * Example: "█" or "▯"
 */
export const ThaiCursorSymbols = {
  block: '█',
  hollow: '▯',
  underscore: '_',
  pipe: '│',
};

/**
 * Thai specific punctuation
 */
export const ThaiPunctuation = {
  ellipsis: '…',
  bullet: '•',
  dashes: {
    em: '—',
    en: '–',
    hyphen: '-',
  },
  quotes: {
    left: '"',
    right: '"',
  },
};
