import express from 'express';
import { json } from 'body-parser';
import { TranslationService } from './translation-service';
import { Language, TranslationRequest } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';
// import { CircuitBreaker, RetryHandler, ServiceHealthChecker } from '@agenticskill/resilience'; // Not directly used in index.ts for middleware

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3005; // Updated default port to 3005

// --- INITIALIZATION ---
console.log("Initializing Translation Layer Service...");
const translationService = new TranslationService();

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'translation-layer' });
});

// Translate text
app.post('/translate', async (req, res, next) => {
  try {
    const { text, from, to }: TranslationRequest = req.body;
    if (!text || !from || !to) {
      return res.status(400).send({ error: 'Missing required fields: text, from, to' });
    }
    const result = await translationService.translate(text, from, to);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

// Detect language
app.post('/detect', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).send({ error: 'Missing required field: text' });
    }
    const result = await translationService.detectLanguage(text);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Translation Layer Service is running on http://localhost:${PORT}`);
});
