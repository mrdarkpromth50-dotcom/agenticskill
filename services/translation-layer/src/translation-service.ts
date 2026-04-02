import axios from 'axios';
import { Language, TranslationRequest, TranslationResponse, LanguageDetectionResponse } from './types';

const TRANSLATION_API_URL = process.env.TRANSLATION_API_URL || 'http://localhost:11434/api/generate'; // Default to Ollama
const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL || 'llama3';

export class TranslationService {

  constructor() {
    console.log(`TranslationService initialized. Using API: ${TRANSLATION_API_URL} with model: ${TRANSLATION_MODEL}`);
  }

  async translate(text: string, fromLang: Language, toLang: Language): Promise<TranslationResponse> {
    const fallbackTranslation = this.getDictionaryTranslation(text, fromLang, toLang);
    if (fallbackTranslation) {
      console.log(`Translated '${text}' using dictionary fallback.`);
      return { translatedText: fallbackTranslation, detectedLanguage: fromLang };
    }

    try {
      const prompt = `Translate the following text from ${fromLang} to ${toLang}:\n\n${text}\n\nTranslated text:`;
      const response = await axios.post(TRANSLATION_API_URL, {
        model: TRANSLATION_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const translatedText = response.data.response.trim();
      console.log(`Translated '${text}' from ${fromLang} to ${toLang} using LLM.`);
      return { translatedText, detectedLanguage: fromLang };
    } catch (error) {
      console.error(`Error during LLM translation from ${fromLang} to ${toLang}:`, error);
      return { translatedText: `[Translation failed for: ${text}]`, detectedLanguage: fromLang };
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    try {
      const prompt = `Detect the language of the following text and respond with only the ISO 639-1 language code (e.g., 'en', 'th', 'fr').\n\nText: ${text}\nLanguage code:`;
      const response = await axios.post(TRANSLATION_API_URL, {
        model: TRANSLATION_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const detectedLanguage = response.data.response.trim().toLowerCase();
      if (detectedLanguage.length === 2 || detectedLanguage.length === 3) {
        console.log(`Detected language for '${text}': ${detectedLanguage}`);
        return { detectedLanguage };
      } else {
        console.warn(`LLM returned unexpected language code: ${detectedLanguage}. Defaulting to 'en'.`);
        return { detectedLanguage: 'en' };
      }
    } catch (error) {
      console.error(`Error during LLM language detection for '${text}':`, error);
      return { detectedLanguage: 'en' };
    }
  }

  async translateToEnglish(text: string): Promise<TranslationResponse> {
    return this.translate(text, 'th', 'en');
  }

  async translateToThai(text: string): Promise<TranslationResponse> {
    return this.translate(text, 'en', 'th');
  }

  private getDictionaryTranslation(text: string, fromLang: Language, toLang: Language): string | undefined {
    const dictionary: { [key: string]: { [key: string]: string } } = {
      'hello': { 'th': 'สวัสดี' },
      'hi': { 'th': 'หวัดดี' },
      'how are you': { 'th': 'สบายดีไหม' },
      'สวัสดี': { 'en': 'hello' },
      'หวัดดี': { 'en': 'hi' },
      'สบายดีไหม': { 'en': 'how are you' },
    };

    const normalizedText = text.toLowerCase().trim();

    if (dictionary[normalizedText] && dictionary[normalizedText][toLang]) {
      return dictionary[normalizedText][toLang];
    }
    return undefined;
  }
}
