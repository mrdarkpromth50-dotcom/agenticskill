import express from 'express';
import { json } from 'body-parser';
import { CTOAgent } from './cto-logic';
import { SystemError } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3010;

// --- INITIALIZATION ---
console.log("Initializing CTO Agent Service...");
const ctoAgent = new CTOAgent();
ctoAgent.start().catch(error => {
  console.error("Failed to start CTO Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'cto-agent' });
});

// Get overall system status and active errors
app.get('/system/status', async (req, res, next) => {
  try {
    const status = await ctoAgent.getSystemStatus();
    res.status(200).send(status);
  } catch (error) {
    next(error);
  }
});

// Get all active errors
app.get('/errors', (req, res) => {
  res.status(200).send(ctoAgent.getErrors());
});

// Manually spawn a debugger agent for a given error
app.post('/debug/spawn', async (req, res, next) => {
  try {
    const { errorId, service, message, level, details }: Partial<SystemError> = req.body;
    if (!errorId || !service || !message || !level) {
      return res.status(400).send({ error: 'Missing required fields for error' });
    }
    const errorToDebug: SystemError = {
      id: errorId,
      service,
      message,
      level,
      timestamp: Date.now(),
      details,
      status: 'new',
    };
    await ctoAgent.spawnDebugger(errorToDebug);
    res.status(200).send({ message: `Debugger Agent spawn initiated for error ${errorId}` });
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`CTO Agent Service is running on http://localhost:${PORT}`);
});
