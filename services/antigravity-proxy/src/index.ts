import express from 'express';
import { json } from 'body-parser';
import { ProviderManager } from './provider-manager';
import { AccountPool } from './account-pool';
import { FallbackChain } from './fallback-chain';
import { ProxyHandler } from './proxy-handler';
import { LLMProviderConfig, LLMAccount } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// --- INITIALIZATION ---
console.log("Initializing Antigravity Proxy Service...");
const providerManager = new ProviderManager();
const accountPool = new AccountPool();
const fallbackChain = new FallbackChain(providerManager, accountPool);
const proxyHandler = new ProxyHandler(fallbackChain);

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'antigravity-proxy' });
});

// Generate text (LLM completion)
app.post('/generate', proxyHandler.handleGenerate.bind(proxyHandler));

// Chat completion
app.post('/chat', proxyHandler.handleChat.bind(proxyHandler));

// List providers
app.get('/providers', (req, res, next) => {
  try {
    res.status(200).send(providerManager.getAllProviders());
  } catch (error) {
    next(error);
  }
});

// Register new provider
app.post('/providers/register', (req, res, next) => {
  try {
    const config: LLMProviderConfig = req.body;
    if (!config.id || !config.type || !config.name || !config.model) {
      return res.status(400).send({ error: 'Missing required provider config fields' });
    }
    providerManager.registerProvider(config);
    res.status(201).send({ message: 'Provider registered successfully', provider: config });
  } catch (error) {
    next(error);
  }
});

// List accounts
app.get('/accounts', (req, res, next) => {
  try {
    res.status(200).send(accountPool.getAccountStats());
  } catch (error) {
    next(error);
  }
});

// Add new account
app.post('/accounts/add', (req, res, next) => {
  try {
    const account: LLMAccount = req.body;
    if (!account.id || !account.providerId || !account.credentials) {
      return res.status(400).send({ error: 'Missing required account fields' });
    }
    accountPool.addAccount(account);
    res.status(201).send({ message: 'Account added successfully', account });
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Antigravity Proxy Service is running on http://localhost:${PORT}`);
});
