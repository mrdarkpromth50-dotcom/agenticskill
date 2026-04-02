import express from 'express';
import { json } from 'body-parser';
import { AccountRotation } from './rotation';
import { HealthCheck } from './health-check';
import { Account } from './types';
import { v4 as uuidv4 } from 'uuid';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';
// import { CircuitBreaker, RetryHandler, ServiceHealthChecker } from '@agenticskill/resilience'; // Not directly used in index.ts for middleware

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3006; // Updated default port to 3006

// --- INITIALIZATION ---
console.log("Initializing Account Manager Service...");
const rotation = new AccountRotation();
const healthCheck = new HealthCheck(rotation);

// Start periodic health check every 5 minutes
healthCheck.startPeriodicCheck(parseInt(process.env.ACCOUNT_HEALTH_CHECK_INTERVAL || '300000', 10));

// --- API ENDPOINTS ---

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'account-manager' });
});

app.get('/accounts', (req, res, next) => {
  try {
    const accounts = rotation.getAccountStats();
    res.status(200).send(accounts);
  } catch (error) {
    next(error);
  }
});

app.post('/accounts', (req, res, next) => {
  try {
    const { type, apiKey } = req.body;
    if (!type || !apiKey) {
      return res.status(400).send({ error: 'Missing required fields: type, apiKey' });
    }
    const newAccount = rotation.addAccount({
      id: uuidv4(),
      type,
      apiKey,
      // usageCount and lastUsed are auto-set by rotation
    });
    res.status(201).send(newAccount);
  } catch (error) {
    next(error);
  }
});

app.delete('/accounts/:id', (req, res, next) => {
  try {
    const wasDeleted = rotation.removeAccount(req.params.id);
    if (wasDeleted) {
      res.status(200).send({ message: `Account ${req.params.id} deleted successfully` });
    } else {
      res.status(404).send({ error: `Account ${req.params.id} not found` });
    }
  } catch (error) {
    next(error);
  }
});

app.get('/accounts/next', (req, res, next) => {
  try {
    const { type, strategy } = req.query;
    let account: Account | undefined;

    if (strategy === 'least-used') {
      account = rotation.getLeastUsedAccount(type as string);
    } else {
      account = rotation.getNextAccount(type as string);
    }

    if (account) {
      res.status(200).send(account);
    } else {
      res.status(404).send({ error: 'No available accounts found' });
    }
  } catch (error) {
    next(error);
  }
});

app.get('/accounts/:id/stats', (req, res, next) => {
  try {
    const stats = rotation.getStatsForAccount(req.params.id);
    if (stats) {
      res.status(200).send(stats);
    } else {
      res.status(404).send({ error: `Account ${req.params.id} not found` });
    }
  } catch (error) {
    next(error);
  }
});

app.post('/accounts/:id/rate-limit', (req, res, next) => {
  try {
    const { duration } = req.body; // in milliseconds
    if (!duration) {
      return res.status(400).send({ error: 'Missing required field: duration' });
    }
    const wasMarked = rotation.markAccountRateLimited(req.params.id, duration);
    if (wasMarked) {
      res.status(200).send({ message: `Account ${req.params.id} marked as rate limited` });
    } else {
      res.status(404).send({ error: `Account ${req.params.id} not found` });
    }
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Account Manager Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = () => {
  console.log('Shutting down Account Manager Service...');
  healthCheck.stopPeriodicCheck();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
