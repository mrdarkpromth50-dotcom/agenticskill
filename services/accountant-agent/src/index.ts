import express from 'express';
import { json } from 'body-parser';
import { AccountantAgent } from './accountant-logic';
import { Transaction } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3009;

// --- INITIALIZATION ---
console.log("Initializing Accountant Agent Service...");
const accountantAgent = new AccountantAgent();
accountantAgent.start().catch(error => {
  console.error("Failed to start Accountant Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'accountant-agent' });
});

// Get all transactions (simulated or from memory)
app.get('/transactions', async (req, res, next) => {
  try {
    const transactions = await accountantAgent.getTransactions();
    res.status(200).send(transactions);
  } catch (error) {
    next(error);
  }
});

// Get financial summary
app.get('/summary', async (req, res, next) => {
  try {
    const summary = await accountantAgent.getSummary();
    res.status(200).send(summary);
  } catch (error) {
    next(error);
  }
});

// Test alert functionality
app.post('/alert/test', async (req, res, next) => {
  try {
    const { amount, currency, description, type, source }: Partial<Transaction> = req.body;
    if (!amount || !currency || !description || !type || !source) {
      return res.status(400).send({ error: 'Missing required fields for test transaction' });
    }
    const testTx: Transaction = {
      id: `test-${Date.now()}`,
      amount,
      currency,
      description,
      type,
      source,
      timestamp: Date.now(),
      status: 'completed',
    };
    await accountantAgent.testAlert(testTx);
    res.status(200).send({ message: 'Test alert sent successfully' });
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Accountant Agent Service is running on http://localhost:${PORT}`);
});
