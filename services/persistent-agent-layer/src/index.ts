import express from 'express';
import { json } from 'body-parser';
import { PersistentAgentManager } from './agent-manager';
import { HeartbeatService } from './heartbeat';
import * as path from 'path';

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
const AGENT_CONFIG_DIR = process.env.AGENT_CONFIG_DIR || path.join(__dirname, '..', '..', 'config', 'agents');
const HEARTBEAT_INTERVAL = parseInt(process.env.PERSISTENT_AGENT_HEARTBEAT_INTERVAL || '30000', 10);
const AUTO_RESTART_ENABLED = process.env.PERSISTENT_AGENT_AUTO_RESTART === 'true';
const PORT = parseInt(process.env.PORT || '3002', 10); // Updated default port to 3002

// --- INITIALIZATION ---
console.log("Initializing Persistent Agent Layer...");
const agentManager = new PersistentAgentManager(AGENT_CONFIG_DIR);
const heartbeatService = new HeartbeatService(agentManager, HEARTBEAT_INTERVAL, AUTO_RESTART_ENABLED);

async function initializeServices() {
  try {
    await agentManager.initializeAgents();
    heartbeatService.start();
    console.log("Persistent Agent Layer initialized successfully.");
  } catch (error) {
    console.error('FATAL: Failed to initialize Persistent Agent Layer:', error);
    process.exit(1);
  }
}
initializeServices();

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'persistent-agent-layer' });
});

// List all agents
app.get('/agents', (req, res, next) => {
  try {
    const agents = agentManager.getAllAgents();
    res.status(200).send(agents);
  } catch (error) {
    next(error);
  }
});

// Get agent status
app.get('/agents/:id/status', (req, res, next) => {
  try {
    const { id } = req.params;
    const status = agentManager.getAgentStatus(id);
    if (status) {
      res.status(200).send(status);
    } else {
      res.status(404).send({ error: `Agent ${id} not found` });
    }
  } catch (error) {
    next(error);
  }
});

// Start agent
app.post('/agents/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await agentManager.startAgent(id);
    if (success) {
      res.status(200).send({ message: `Agent ${id} started successfully` });
    } else {
      res.status(400).send({ error: `Failed to start agent ${id}` });
    }
  } catch (error) {
    next(error);
  }
});

// Stop agent
app.post('/agents/:id/stop', async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await agentManager.stopAgent(id);
    if (success) {
      res.status(200).send({ message: `Agent ${id} stopped successfully` });
    } else {
      res.status(400).send({ error: `Failed to stop agent ${id}` });
    }
  } catch (error) {
    next(error);
  }
});

// Restart agent
app.post('/agents/:id/restart', async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await agentManager.restartAgent(id);
    if (success) {
      res.status(200).send({ message: `Agent ${id} restarted successfully` });
    } else {
      res.status(400).send({ error: `Failed to restart agent ${id}` });
    }
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---

app.listen(PORT, () => {
  console.log(`Persistent Agent Layer Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---

const shutdown = async () => {
  console.log('Shutting down Persistent Agent Layer Service gracefully...');
  try {
    heartbeatService.stop();
    // In a real scenario, you might want to stop all running agents here.
    // For now, we just stop the heartbeat.
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
