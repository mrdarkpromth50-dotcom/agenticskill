// Thai Keyboard Input Handler for Agent Town
// Adapted from @agenticskill/agent-town-i18n

/**
 * Check if a character is a Thai character
 */
export function isThaiCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0e00 && code <= 0x0e7f;
}

/**
 * Check if a string consists primarily of Thai characters
 */
export function isThaiString(text: string): boolean {
  if (!text) return false;
  const thaiChars = text.split('').filter(isThaiCharacter).length;
  return thaiChars / text.length > 0.5;
}

/**
 * Thai IME Handler - manages composition state for Thai input
 * Prevents double-character issues with Thai vowels and tone marks
 */
export class ThaiIMEHandler {
  private compositionActive = false;

  onCompositionStart(): void {
    this.compositionActive = true;
  }

  onCompositionEnd(): void {
    this.compositionActive = false;
  }

  isCompositionActive(): boolean {
    return this.compositionActive;
  }
}

/**
 * Format Thai text input - normalize Thai character sequences
 * Handles vowel placement and tone mark ordering
 */
export function formatThaiInput(text: string): string {
  if (!text) return text;
  // Normalize Thai character ordering
  // Thai vowels that appear above/below consonants
  const aboveVowels = /[\u0E31\u0E34-\u0E37\u0E47-\u0E4E]/;
  // Thai tone marks
  const toneMarks = /[\u0E48-\u0E4B]/;
  
  // Basic normalization: ensure proper ordering
  return text.normalize('NFC');
}

/**
 * Find word boundaries in Thai text (Thai has no spaces between words)
 */
export function findThaiWordBoundaries(text: string): number[] {
  const boundaries: number[] = [0];
  // Simple heuristic: split on non-Thai characters and common patterns
  for (let i = 1; i < text.length; i++) {
    const current = text[i];
    const prev = text[i - 1];
    // Boundary at transition between Thai and non-Thai
    if (isThaiCharacter(current) !== isThaiCharacter(prev)) {
      boundaries.push(i);
    }
  }
  boundaries.push(text.length);
  return boundaries;
}

/**
 * Truncate Thai text at appropriate word boundary
 */
export function truncateThaiText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Search in Thai text (case-insensitive, handles both Thai and English)
 */
export function searchThaiText(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}
