import express from 'express';
import { json } from 'body-parser';
import { CSOAgent } from './cso-logic';
import { StrategicGoal } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3012;

// --- INITIALIZATION ---
console.log("Initializing CSO Agent Service...");
const csoAgent = new CSOAgent();
csoAgent.start().catch(error => {
  console.error("Failed to start CSO Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'cso-agent' });
});

// Get all active strategy plans
app.get('/strategy', async (req, res, next) => {
  try {
    const plans = csoAgent.getStrategyPlans();
    res.status(200).send(plans);
  } catch (error) {
    next(error);
  }
});

// Develop a new strategy based on a goal
app.post('/strategy/develop', async (req, res, next) => {
  try {
    const { id, name, description, targetMetrics, startDate, endDate }: StrategicGoal = req.body;
    if (!id || !name || !description || !targetMetrics || !startDate || !endDate) {
      return res.status(400).send({ error: 'Missing required fields for strategic goal' });
    }
    const goal: StrategicGoal = { id, name, description, targetMetrics, startDate, endDate };
    const plan = await csoAgent.developStrategy(goal);
    res.status(201).send(plan);
  } catch (error) {
    next(error);
  }
});

// Get competitor analysis data
app.get('/competitors', async (req, res, next) => {
  try {
    const competitors = csoAgent.getCompetitors();
    res.status(200).send(competitors);
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`CSO Agent Service is running on http://localhost:${PORT}`);
});
