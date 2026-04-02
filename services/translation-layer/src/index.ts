import express from 'express';
import { json } from 'body-parser';
import { TranslationService } from './translation-service';
import { Language, TranslationRequest } from './types';

const app = express();
app.use(json());

const PORT = process.env.PORT || 3001;

// --- INITIALIZATION ---
console.log("Initializing Translation Layer Service...");
const translationService = new TranslationService();

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'translation-layer' });
});

// Translate text
app.post('/translate', async (req, res) => {
  try {
    const { text, from, to }: TranslationRequest = req.body;
    if (!text || !from || !to) {
      return res.status(400).send({ error: 'Missing required fields: text, from, to' });
    }
    const result = await translationService.translate(text, from, to);
    res.status(200).send(result);
  } catch (error) {
    console.error('[API ERROR] POST /translate:', error);
    res.status(500).send({ error: 'Internal server error during translation' });
  }
});

// Detect language
app.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Missing required field: text' });
    }
    const result = await translationService.detectLanguage(text);
    res.status(200).send(result);
  } catch (error) {
    console.error('[API ERROR] POST /detect:', error);
    res.status(500).send({ error: 'Internal server error during language detection' });
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Translation Layer Service is running on http://localhost:${PORT}`);
});
