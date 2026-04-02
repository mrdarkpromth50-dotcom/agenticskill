// Thai Keyboard and Input Handling Utilities

/**
 * Thai Input Method Editor (IME) support
 * Handles proper Thai character composition
 */
export class ThaiIMEHandler {
  private isComposing = false;
  private buffer = '';

  /**
   * Handle IME composition start
   */
  onCompositionStart(): void {
    this.isComposing = true;
  }

  /**
   * Handle IME composition end
   */
  onCompositionEnd(text: string): string {
    this.isComposing = false;
    this.buffer = '';
    return text;
  }

  /**
   * Check if currently composing
   */
  isCompositionActive(): boolean {
    return this.isComposing;
  }

  /**
   * Get composition buffer
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Clear composition buffer
   */
  clearBuffer(): void {
    this.buffer = '';
  }
}

/**
 * Thai keyboard layout mapping
 * Maps English keys to Thai characters
 */
export const ThaiKeyboardLayout: Record<string, string> = {
  q: 'ฝ',
  w: 'ห',
  e: 'ึ',
  r: 'ค',
  t: 'ต',
  y: 'ุ',
  u: 'ื',
  i: 'ท',
  o: 'โ',
  p: 'ฌ',
  '[': 'ป',
  ']': 'ฬ',

  a: 'ั',
  s: 'ี',
  d: 'ร',
  f: 'น',
  g: 'ง',
  h: 'ห',
  j: 'ม',
  k: 'ย',
  l: 'ล',
  ';': 'ว',
  "'": 'ซ',

  z: 'ผ',
  x: 'พ',
  c: 'ถ',
  v: 'ค',
  b: 'ส',
  n: 'ณ',
  m: 'จ',
  ',': 'ฉ',
  '.': 'ข',
  '/': 'ฮ',
};

/**
 * Thai vowel placement rules
 * Some vowels are placed above/below/after consonants
 */
export const ThaiVowelPlacement: Record<string, 'above' | 'below' | 'after' | 'before'> = {
  'ึ': 'above',
  'ื': 'above',
  'ุ': 'below',
  'เ': 'before',
  'แ': 'before',
  'ไ': 'before',
  'โ': 'before',
  'ั': 'above',
  'ิ': 'above',
  'ี': 'above',
};

/**
 * Thai tone marks
 */
export enum ThaiToneMark {
  MaiTho = '่', // ่ (low tone)
  MaiTri = '้', // ้ (falling tone)
  MaiChattawa = '๎', // ๎ (high tone)
  MaiMontho = '๏', // ๏ (rising tone)
}

/**
 * Check if character is Thai
 */
export function isThaiCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0xe00 && code <= 0xe7f;
}

/**
 * Check if string contains only Thai characters
 */
export function isThaiString(str: string): boolean {
  return str.split('').every(char => isThaiCharacter(char) || char === ' ');
}

/**
 * Convert Roman letters to Thai keyboard layout
 * Example: 'hello' -> 'หวลฮ'
 * Note: This is phonetic approximation, not accurate transliteration
 */
export function romanToThaiKeyboard(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(char => ThaiKeyboardLayout[char] || char)
    .join('');
}

/**
 * Thai text input formatter
 * - Removes leading/trailing spaces
 * - Normalizes spaces
 * - Applies proper Thai spacing rules
 */
export function formatThaiInput(text: string): string {
  // Remove leading/trailing spaces
  text = text.trim();

  // Normalize multiple spaces to single space
  text = text.replace(/\s+/g, ' ');

  // Add space before tone marks if missing
  text = text.replace(/([ก-๏])([่้๎๏])/g, '$1$2');

  return text;
}

/**
 * Thai word break detection
 * Thai doesn't use spaces for word separation, so we need sophisticated detection
 */
export function findThaiWordBoundaries(text: string): number[] {
  const boundaries: number[] = [0];
  let i = 0;

  while (i < text.length) {
    // Skip tone marks and vowel marks
    while (
      i < text.length &&
      (isThaiCharacter(text[i]) && /[่้๎๏ิีึืุ]/.test(text[i]))
    ) {
      i++;
    }

    if (i < text.length) {
      boundaries.push(i);
      i++;
    }
  }

  boundaries.push(text.length);
  return boundaries;
}

/**
 * Thai text truncation with proper word breaking
 */
export function truncateThaiText(
  text: string,
  maxLength: number,
  suffix: string = '…'
): string {
  if (text.length <= maxLength) return text;

  const boundaries = findThaiWordBoundaries(text);
  let truncated = text;

  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (boundaries[i] + suffix.length <= maxLength) {
      truncated = text.substring(0, boundaries[i]) + suffix;
      break;
    }
  }

  return truncated;
}

/**
 * Thai RTL (Right-to-Left) support generator
 * Some Thai text displays better with explicit RTL markers
 */
export function wrapThaiRTL(text: string): string {
  const hasThaiChars = text.split('').some(char => isThaiCharacter(char));
  if (!hasThaiChars) return text;

  // Unicode RTL mark
  return '\u202E' + text + '\u202C';
}

/**
 * Thai character to pinyin/latin approximation for search
 * Useful for search without Thai keyboard
 */
export const ThaiToLatin: Record<string, string> = {
  ก: 'k',
  ข: 'kh',
  ค: 'kh',
  ง: 'ng',
  จ: 'ch',
  ฉ: 'ch',
  ช: 'ch',
  ซ: 's',
  ส: 's',
  ย: 'y',
  ด: 'd',
  ต: 't',
  ถ: 'th',
  ท: 'th',
  น: 'n',
  บ: 'b',
  ป: 'p',
  พ: 'ph',
  ฟ: 'f',
  ม: 'm',
  ย: 'y',
  ร: 'r',
  ล: 'l',
  ว: 'w',
  ห: 'h',
  อ: 'o',
};

/**
 * Thai text search helper
 * Search still works if user types English approximation
 */
export function searchThaiText(haystack: string, needle: string): boolean {
  const thaiNeedle = needle
    .split('')
    .map(char => ThaiKeyboardLayout[char.toLowerCase()] || char)
    .join('');

  return (
    haystack.includes(needle) ||
    haystack.includes(thaiNeedle) ||
    needle.includes(haystack)
  );
}
