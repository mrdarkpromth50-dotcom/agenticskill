export type TranslationMode = 'llm' | 'api';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  modeUsed: TranslationMode;
  modelOrApi: string;
  timestamp: number;
}
