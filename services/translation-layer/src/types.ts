export type Language = string; // e.g., 'en', 'th'

export interface TranslationRequest {
  text: string;
  from: Language;
  to: Language;
}

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: Language;
}

export interface LanguageDetectionResponse {
  detectedLanguage: Language;
  confidence?: number;
}
