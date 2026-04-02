import { TranslationService } from './translation-service';
import { TranslationMode } from './types';

async function main() {
  console.log('Starting Translation Layer Service...');

  const mode: TranslationMode = (process.env.TRANSLATION_MODE as TranslationMode) || 'llm';
  const model: string = process.env.TRANSLATION_MODEL || 'gemini-3-flash';

  const translationService = new TranslationService(mode, model);

  // Example usage (for testing/demonstration)
  // const textToTranslate = 'สวัสดีครับ';
  // const translatedText = await translationService.translate(textToTranslate, 'th', 'en');
  // console.log(`'${textToTranslate}' (th) -> '${translatedText}' (en)`);

  console.log('Translation Layer Service started.');
}

main().catch(error => {
  console.error('Translation Layer Service failed to start:', error);
  process.exit(1);
});
