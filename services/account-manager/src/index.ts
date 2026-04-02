import express from 'express';
import { json } from 'body-parser';
import { AccountRotation } from './rotation';
import { HealthCheck } from './health-check';
import { Account } from './types';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(json());

const PORT = process.env.PORT || 3004;

// --- INITIALIZATION ---
console.log("Initializing Account Manager Service...");
const rotation = new AccountRotation();
const healthCheck = new HealthCheck(rotation);

// Start periodic health check every 5 minutes
healthCheck.startPeriodicCheck(300000);

// --- API ENDPOINTS ---

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'account-manager' });
});

app.get('/accounts', (req, res) => {
  try {
    const accounts = rotation.getAccountStats();
    res.status(200).send(accounts);
  } catch (error) {
    console.error('[API ERROR] GET /accounts:', error);
    res.status(500).send({ error: 'Internal server error while retrieving accounts' });
  }
});

app.post('/accounts', (req, res) => {
  try {
    const { type, apiKey } = req.body;
    if (!type || !apiKey) {
      return res.status(400).send({ error: 'Missing required fields: type, apiKey' });
    }
    const newAccount = rotation.addAccount({
      id: uuidv4(),
      type,
      apiKey,
      usageCount: 0,
      lastUsed: 0
    });
    res.status(201).send(newAccount);
  } catch (error) {
    console.error('[API ERROR] POST /accounts:', error);
    res.status(500).send({ error: 'Internal server error while adding account' });
  }
});

app.delete('/accounts/:id', (req, res) => {
  try {
    const wasDeleted = rotation.removeAccount(req.params.id);
    if (wasDeleted) {
      res.status(200).send({ message: `Account ${req.params.id} deleted successfully` });
    } else {
      res.status(404).send({ error: `Account ${req.params.id} not found` });
    }
  } catch (error) {
    console.error(`[API ERROR] DELETE /accounts/${req.params.id}:`, error);
    res.status(500).send({ error: 'Internal server error while deleting account' });
  }
});

app.get('/accounts/next', (req, res) => {
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
    console.error('[API ERROR] GET /accounts/next:', error);
    res.status(500).send({ error: 'Internal server error while retrieving next account' });
  }
});

app.get('/accounts/:id/stats', (req, res) => {
  try {
    const stats = rotation.getStatsForAccount(req.params.id);
    if (stats) {
      res.status(200).send(stats);
    } else {
      res.status(404).send({ error: `Account ${req.params.id} not found` });
    }
  } catch (error) {
    console.error(`[API ERROR] GET /accounts/${req.params.id}/stats:`, error);
    res.status(500).send({ error: 'Internal server error while retrieving account stats' });
  }
});

app.post('/accounts/:id/rate-limit', (req, res) => {
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
    console.error(`[API ERROR] POST /accounts/${req.params.id}/rate-limit:`, error);
    res.status(500).send({ error: 'Internal server error while marking rate limit' });
  }
});

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
