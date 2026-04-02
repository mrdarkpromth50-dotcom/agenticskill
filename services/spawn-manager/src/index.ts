import express from 'express';
import { json } from 'body-parser';
import { SpawnManager } from './process-manager';
import { TaskQueue } from './task-queue';
import { AgentPool } from './agent-pool';
import { ResultHandler } from './result-handler';
import * as path from 'path';

const app = express();
app.use(json());

// --- CONFIGURATION ---
const AGENT_CONFIG_DIR = process.env.AGENT_CONFIG_DIR || path.join(__dirname, '..', '..', 'config', 'agents');
const PORT = parseInt(process.env.PORT || '3003', 10); // Updated default port to 3003

// --- INITIALIZATION ---
console.log("Initializing Spawn Manager Service...");
const taskQueue = new TaskQueue();
const agentPool = new AgentPool();
const resultHandler = new ResultHandler();
const spawnManager = new SpawnManager(taskQueue, agentPool, resultHandler, AGENT_CONFIG_DIR);

async function initializeServices() {
  try {
    await spawnManager.initializeAgentConfigs();
    spawnManager.startTaskListener();
    console.log("Spawn Manager Service initialized successfully.");
  } catch (error) {
    console.error('FATAL: Failed to initialize Spawn Manager Service:', error);
    process.exit(1);
  }
}

initializeServices();

// --- API ENDPOINTS ---

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'spawn-manager' });
});

app.post('/tasks', (req, res) => {
  try {
    const { agentType, description, payload, requesterCallbackUrl } = req.body;
    if (!agentType || !description) {
      return res.status(400).send({ error: 'Missing required fields: agentType, description' });
    }
    const newTask = taskQueue.enqueue(agentType, description, payload || {}, requesterCallbackUrl);
    res.status(201).send(newTask);
  } catch (error) {
    console.error('[API ERROR] POST /tasks:', error);
    res.status(500).send({ error: 'Internal server error while creating task' });
  }
});

app.get('/tasks', (req, res) => {
  const { status } = req.query;
  try {
    const tasks = status ? taskQueue.getTasksByStatus(status as any) : taskQueue.getAllTasks();
    res.status(200).send(tasks);
  } catch (error) {
    console.error('[API ERROR] GET /tasks:', error);
    res.status(500).send({ error: 'Internal server error while retrieving tasks' });
  }
});

app.get('/tasks/:id', (req, res) => {
  try {
    const task = taskQueue.getTask(req.params.id);
    if (task) {
      res.status(200).send(task);
    } else {
      res.status(404).send({ error: `Task ${req.params.id} not found` });
    }
  } catch (error) {
    console.error(`[API ERROR] GET /tasks/${req.params.id}:`, error);
    res.status(500).send({ error: 'Internal server error while retrieving task' });
  }
});

app.put('/tasks/:id/status', (req, res) => {
  try {
    const { status, result, error: taskError } = req.body;
    if (!status) {
      return res.status(400).send({ error: 'Missing required field: status' });
    }
    const updatedTask = taskQueue.updateTask(req.params.id, { status, result, error: taskError });
    if (updatedTask) {
      // Also update result handler
      resultHandler.handleResult(req.params.id, result, status, taskError);
      res.status(200).send(updatedTask);
    } else {
      res.status(404).send({ error: `Task ${req.params.id} not found` });
    }
  } catch (error) {
    console.error(`[API ERROR] PUT /tasks/${req.params.id}/status:`, error);
    res.status(500).send({ error: 'Internal server error while updating task' });
  }
});

app.delete('/tasks/:id', (req, res) => {
  try {
    const wasDeleted = taskQueue.deleteTask(req.params.id);
    if (wasDeleted) {
      res.status(200).send({ message: `Task ${req.params.id} deleted successfully` });
    } else {
      res.status(404).send({ error: `Task ${req.params.id} not found` });
    }
  } catch (error) {
    console.error(`[API ERROR] DELETE /tasks/${req.params.id}:`, error);
    res.status(500).send({ error: 'Internal server error while deleting task' });
  }
});

app.get('/agents/active', (req, res) => {
  try {
    const activeAgents = spawnManager.getActiveAgents();
    res.status(200).send(activeAgents);
  } catch (error) {
    console.error('[API ERROR] GET /agents/active:', error);
    res.status(500).send({ error: 'Internal server error while retrieving active agents' });
  }
});

// New API endpoints for AgentPool
app.get('/pool/stats', (req, res) => {
  try {
    const stats = spawnManager.getAgentPoolStats();
    res.status(200).send(stats);
  } catch (error) {
    console.error('[API ERROR] GET /pool/stats:', error);
    res.status(500).send({ error: 'Internal server error while retrieving agent pool stats' });
  }
});

app.post('/pool/register', (req, res) => {
  try {
    const { type, config } = req.body;
    if (!type || !config) {
      return res.status(400).send({ error: 'Missing required fields: type, config' });
    }
    spawnManager.registerAgentType(type, config);
    res.status(200).send({ message: `Agent type ${type} registered successfully` });
  } catch (error) {
    console.error('[API ERROR] POST /pool/register:', error);
    res.status(500).send({ error: 'Internal server error while registering agent type' });
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Spawn Manager Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = () => {
  console.log('Shutting down Spawn Manager Service...');
  spawnManager.stopTaskListener();
  // Here you might want to handle active tasks, e.g., by marking them as pending again
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
