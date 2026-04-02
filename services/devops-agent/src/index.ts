import express from 'express';
import { json } from 'body-parser';
import { DevOpsAgent } from './devops-logic';
import { PipelineConfig } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3013;

// --- INITIALIZATION ---
console.log("Initializing DevOps Agent Service...");
const devOpsAgent = new DevOpsAgent();
devOpsAgent.start().catch(error => {
  console.error("Failed to start DevOps Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'devops-agent' });
});

// Get infrastructure status
app.get('/infrastructure', async (req, res, next) => {
  try {
    const status = devOpsAgent.getInfrastructureStatus();
    res.status(200).send(status);
  } catch (error) {
    next(error);
  }
});

// Deploy a service
app.post('/deploy', async (req, res, next) => {
  try {
    const { serviceName, version, pipelineId } = req.body;
    if (!serviceName || !version) {
      return res.status(400).send({ error: 'Missing serviceName or version' });
    }
    const deployment = await devOpsAgent.deployService(serviceName, version, pipelineId);
    res.status(202).send(deployment);
  } catch (error) {
    next(error);
  }
});

// Rollback a service
app.post('/rollback', async (req, res, next) => {
  try {
    const { serviceName, version } = req.body;
    if (!serviceName || !version) {
      return res.status(400).send({ error: 'Missing serviceName or version' });
    }
    const rollback = await devOpsAgent.rollback(serviceName, version);
    res.status(202).send(rollback);
  } catch (error) {
    next(error);
  }
});

// Get all pipelines
app.get('/pipelines', async (req, res, next) => {
  try {
    const pipelines = devOpsAgent.getPipelines();
    res.status(200).send(pipelines);
  } catch (error) {
    next(error);
  }
});

// Create a new pipeline
app.post('/pipelines', async (req, res, next) => {
  try {
    const { name, repository, branch, stages }: PipelineConfig = req.body;
    if (!name || !repository || !branch || !stages) {
      return res.status(400).send({ error: 'Missing required fields for pipeline creation' });
    }
    const pipeline = await devOpsAgent.managePipeline({ id: '', name, repository, branch, stages });
    res.status(201).send(pipeline);
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`DevOps Agent Service is running on http://localhost:${PORT}`);
});
