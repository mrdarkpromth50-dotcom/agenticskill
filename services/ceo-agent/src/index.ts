import express from 'express';
import { json } from 'body-parser';
import { CEOAgent } from './ceo-logic';
import { BossCommand } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';
// import { CircuitBreaker, RetryHandler, ServiceHealthChecker } from '@agenticskill/resilience'; // Not directly used in index.ts for middleware

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3004;

// --- INITIALIZATION ---
console.log("Initializing CEO Agent Service...");
const ceoAgent = new CEOAgent();
ceoAgent.start().catch(error => {
  console.error("Failed to start CEO Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'ceo-agent' });
});

// Get CEO Agent status
app.get('/status', (req, res, next) => {
  try {
    const status = ceoAgent.getStatus();
    res.status(200).send(status);
  } catch (error) {
    next(error);
  }
});

// Get active plans
app.get('/plans', (req, res, next) => {
  try {
    const activePlans = ceoAgent.getActivePlans();
    res.status(200).send(activePlans);
  } catch (error) {
    next(error);
  }
});

// Trigger a report to the boss
app.post('/report', async (req, res, next) => {
  try {
    await ceoAgent.triggerReport();
    res.status(200).send({ message: 'Report triggered successfully' });
  } catch (error) {
    next(error);
  }
});

// Receive command from an external source (e.g., another service or a mock boss)
app.post('/command', async (req, res, next) => {
  try {
    const { text, sender, source }: BossCommand = req.body;
    if (!text || !sender || !source) {
      return res.status(400).send({ error: 'Missing required fields: text, sender, source' });
    }
    await ceoAgent.receiveCommand({ text, sender, source });
    res.status(202).send({ message: 'Command received and being processed' });
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`CEO Agent Service is running on http://localhost:${PORT}`);
});
