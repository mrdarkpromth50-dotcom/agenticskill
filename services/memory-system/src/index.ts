import express from 'express';
import { json } from 'body-parser';
import { MemoryManager } from './memory-manager';
import { ShortTermMemoryStoreRequest, LongTermMemoryStoreRequest, LongTermMemorySearchRequest } from './types';

const app = express();
app.use(json());

// --- CONFIGURATION ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHROMADB_URL = process.env.CHROMADB_URL || 'http://localhost:8000';
const PORT = process.env.PORT || 3000;

// --- INITIALIZATION ---
console.log("Initializing Memory Manager...");
const memoryManager = new MemoryManager(REDIS_URL, CHROMADB_URL);

memoryManager.connect().catch(err => {
  console.error('FATAL: Failed to connect to memory services on startup:', err);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// --- Short-Term Memory (Redis) ---

app.post('/memory/short-term', async (req, res) => {
  try {
    const { agentId, key, value, ttl } = req.body as ShortTermMemoryStoreRequest;
    if (!agentId || !key || value === undefined) {
      return res.status(400).send({ error: 'Missing required fields: agentId, key, value' });
    }
    await memoryManager.storeShortTermMemory({ agentId, key, value, ttl });
    console.log(`Stored short-term memory for agent [${agentId}] at key [${key}]`);
    res.status(201).send({ message: 'Short-term memory stored successfully' });
  } catch (error) {
    console.error('[API ERROR] POST /memory/short-term:', error);
    res.status(500).send({ error: 'Internal server error while storing short-term memory' });
  }
});

app.get('/memory/short-term/:agentId/:key', async (req, res) => {
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
    console.error('[API ERROR] GET /memory/short-term/:agentId/:key:', error);
    res.status(500).send({ error: 'Internal server error while retrieving short-term memory' });
  }
});

// --- Long-Term Memory (ChromaDB) ---

app.post('/memory/long-term', async (req, res) => {
  try {
    const { agentId, document, embedding, metadata } = req.body as LongTermMemoryStoreRequest;
    if (!agentId || !document || !embedding) {
      return res.status(400).send({ error: 'Missing required fields: agentId, document, embedding' });
    }
    const docId = await memoryManager.storeLongTermMemory({ agentId, document, embedding, metadata });
    console.log(`Stored long-term memory for agent [${agentId}], received ID [${docId}]`);
    res.status(201).send({ message: 'Long-term memory stored successfully', id: docId });
  } catch (error) {
    console.error('[API ERROR] POST /memory/long-term:', error);
    res.status(500).send({ error: 'Internal server error while storing long-term memory' });
  }
});

app.post('/memory/long-term/search', async (req, res) => {
  try {
    const { agentId, queryEmbedding, nResults, where } = req.body as LongTermMemorySearchRequest;
    if (!agentId || !queryEmbedding) {
      return res.status(400).send({ error: 'Missing required fields: agentId, queryEmbedding' });
    }
    const results = await memoryManager.searchLongTermMemory({ agentId, queryEmbedding, nResults, where });
    console.log(`Performed long-term memory search for agent [${agentId}], found ${results.length} results`);
    res.status(200).send({ results });
  } catch (error) {
    console.error('[API ERROR] POST /memory/long-term/search:', error);
    res.status(500).send({ error: 'Internal server error while searching long-term memory' });
  }
});

// --- SERVER START ---

app.listen(PORT, () => {
  console.log(`Memory System Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---

const shutdown = async () => {
  console.log('Shutting down Memory System Service gracefully...');
  try {
    await memoryManager.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
