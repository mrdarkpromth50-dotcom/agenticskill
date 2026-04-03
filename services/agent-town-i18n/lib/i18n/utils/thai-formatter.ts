// Thai Formatter Utilities for Agent Town
// Adapted from @agenticskill/agent-town-i18n

/**
 * Convert Western Arabic numerals to Thai numerals
 */
export function toThaiDigits(num: number | string): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(num).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d)]);
}

/**
 * Format a number in Thai locale
 */
export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('th-TH', options).format(num);
}

/**
 * Format a date in Thai locale (Buddhist Era)
 */
export function formatDateTHAI(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * Format time in Thai locale
 */
export function formatTimeTHAI(date: Date): string {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format relative time in Thai
 */
export function formatRelativeTimeTHAI(isoString?: string): string {
  if (!isoString) return '';
  const ms = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'เดี๋ยวนี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}

/**
 * Check if a string contains Thai characters
 */
export function containsThaiCharacters(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text);
}

/**
 * Detect language of a string
 */
export function detectLanguage(text: string): 'th' | 'en' | 'mixed' {
  const hasThai = containsThaiCharacters(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  if (hasThai && hasLatin) return 'mixed';
  if (hasThai) return 'th';
  return 'en';
}

/**
 * Format compact number in Thai (K, M, B)
 */
export function formatCompactTHAI(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

/**
 * Format model label (shared utility)
 */
export function formatModelLabel(model?: string): string {
  if (!model) return 'ยังไม่มีโมเดล';
  if (model.length <= 22) return model;
  const pieces = model.split(/[/:]/).filter(Boolean);
  const tail = pieces[pieces.length - 1];
  return tail && tail.length <= 22 ? tail : `${model.slice(0, 19)}...`;
}
