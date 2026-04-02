import express from 'express';
import { json } from 'body-parser';
import { MemoryManager } from './memory-manager';
import { SharedMemory } from './shared-memory';
import { MemorySearch } from './memory-search';
import { ShortTermMemoryStoreRequest, LongTermMemoryStoreRequest, LongTermMemorySearchRequest } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';
// import { CircuitBreaker, RetryHandler, ServiceHealthChecker } from '@agenticskill/resilience'; // Not directly used in index.ts for middleware

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

// --- CONFIGURATION ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHROMADB_URL = process.env.CHROMADB_URL || 'http://localhost:8000';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001; // Updated default port to 3001

// --- INITIALIZATION ---
console.log("Initializing Memory System Service...");
const memoryManager = new MemoryManager(REDIS_URL, CHROMADB_URL);
const sharedMemory = new SharedMemory(REDIS_URL);
let memorySearch: MemorySearch; // Will be initialized after memoryManager connects

memoryManager.connect().then(() => {
  console.log("Memory Manager connected. Initializing Memory Search...");
  memorySearch = new MemorySearch(memoryManager.getVectorDBClient());
}).catch(err => {
  console.error('FATAL: Failed to connect to memory services on startup:', err);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'memory-system' });
});

// --- Short-Term Memory (Redis) ---

app.post('/memory/short-term', async (req, res, next) => {
  try {
    const { agentId, key, value, ttl } = req.body as ShortTermMemoryStoreRequest;
    if (!agentId || !key || value === undefined) {
      return res.status(400).send({ error: 'Missing required fields: agentId, key, value' });
    }
    await memoryManager.storeShortTermMemory({ agentId, key, value, ttl });
    console.log(`Stored short-term memory for agent [${agentId}] at key [${key}]`);
    res.status(201).send({ message: 'Short-term memory stored successfully' });
  } catch (error) {
    next(error);
  }
});

app.get('/memory/short-term/:agentId/:key', async (req, res, next) => {
  try {
    const { agentId, key } = req.params;
    const value = await memoryManager.getShortTermMemory(agentId, key);
    if (value !== null) {
      console.log(`Retrieved short-term memory for agent [${agentId}] from key [${key}]`);
      res.status(200).send({ agentId, key, value });
    } else {
      console.log(`No short-term memory found for agent [${agentId}] at key [${key}]`);
      res.status(404).send({ error: 'Short-term memory not found' });
    }
  } catch (error) {
    next(error);
  }
});

// --- Long-Term Memory (ChromaDB) ---

app.post('/memory/long-term', async (req, res, next) => {
  try {
    const { agentId, document, embedding, metadata } = req.body as LongTermMemoryStoreRequest;
    if (!agentId || !document || !embedding) {
      return res.status(400).send({ error: 'Missing required fields: agentId, document, embedding' });
    }
    const docId = await memoryManager.storeLongTermMemory({ agentId, document, embedding, metadata });
    console.log(`Stored long-term memory for agent [${agentId}], received ID [${docId}]`);
    res.status(201).send({ message: 'Long-term memory stored successfully', id: docId });
  } catch (error) {
    next(error);
  }
});

app.post('/memory/long-term/search', async (req, res, next) => {
  try {
    const { agentId, queryEmbedding, nResults, where } = req.body as LongTermMemorySearchRequest;
    if (!agentId || !queryEmbedding) {
      return res.status(400).send({ error: 'Missing required fields: agentId, queryEmbedding' });
    }
    const results = await memoryManager.searchLongTermMemory({ agentId, queryEmbedding, nResults, where });
    console.log(`Performed long-term memory search for agent [${agentId}], found ${results.length} results`);
    res.status(200).send({ results });
  } catch (error) {
    next(error);
  }
});

// --- Shared Memory (Redis Pub/Sub & State) ---

app.post('/memory/shared/publish', async (req, res, next) => {
  try {
    const { channel, message } = req.body;
    if (!channel || !message) {
      return res.status(400).send({ error: 'Missing required fields: channel, message' });
    }
    await sharedMemory.publish(channel, message);
    res.status(200).send({ message: 'Message published to shared memory' });
  } catch (error) {
    next(error);
  }
});

// Note: Subscribing via HTTP is tricky for persistent connections. This is a simplified example.
// A real-world scenario might use WebSockets or server-sent events.
app.post('/memory/shared/subscribe', async (req, res, next) => {
  try {
    const { channel } = req.body;
    if (!channel) {
      return res.status(400).send({ error: 'Missing required field: channel' });
    }
    // For demonstration, we'll just acknowledge subscription. Actual message delivery would be async.
    // In a real app, you'd likely establish a WebSocket connection here.
    await sharedMemory.subscribe(channel, (msg) => {
      console.log(`[SharedMemory API] Received subscribed message on ${channel}: ${msg}`);
      // Here you would typically push this message to the client via WebSocket
    });
    res.status(200).send({ message: `Subscribed to shared memory channel ${channel}. Messages will be logged.` });
  } catch (error) {
    next(error);
  }
});

app.post('/memory/shared/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).send({ error: 'Missing required field: value' });
    }
    await sharedMemory.setSharedState(key, value);
    res.status(201).send({ message: `Shared state for key ${key} set successfully` });
  } catch (error) {
    next(error);
  }
});

app.get('/memory/shared/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const value = await sharedMemory.getSharedState(key);
    if (value !== null) {
      res.status(200).send({ key, value });
    } else {
      res.status(404).send({ error: `Shared state for key ${key} not found` });
    }
  } catch (error) {
    next(error);
  }
});

// --- Advanced Memory Search ---

app.post('/memory/search/advanced', async (req, res, next) => {
  try {
    if (!memorySearch) {
      return res.status(503).send({ error: 'Memory search not initialized yet. Please try again.' });
    }
    const { agentId, query, startTime, endTime, searchType, limit } = req.body;
    let results;

    switch (searchType) {
      case 'byAgent':
        if (!agentId) return res.status(400).send({ error: 'Missing agentId for byAgent search' });
        results = await memorySearch.searchByAgent(agentId, query, limit);
        break;
      case 'byTimeRange':
        if (!startTime || !endTime) return res.status(400).send({ error: 'Missing startTime or endTime for byTimeRange search' });
        results = await memorySearch.searchByTimeRange(startTime, endTime, query, limit);
        break;
      case 'similar':
        if (!query) return res.status(400).send({ error: 'Missing query for similar search' });
        results = await memorySearch.searchSimilar(query, limit);
        break;
      default:
        return res.status(400).send({ error: 'Invalid searchType specified. Must be byAgent, byTimeRange, or similar.' });
    }
    res.status(200).send({ results });
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---

app.listen(PORT, () => {
  console.log(`Memory System Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---

const shutdown = async () => {
  console.log('Shutting down Memory System Service gracefully...');
  try {
    await memoryManager.disconnect();
    // Disconnect Redis clients for shared memory
    // sharedMemory.disconnect(); // Assuming a disconnect method exists or handle client closing
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
