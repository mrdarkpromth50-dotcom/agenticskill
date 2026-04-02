import express from 'express';
import { json } from 'body-parser';
import { CMOAgent } from './cmo-logic';
import { CampaignConfig } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3011;

// --- INITIALIZATION ---
console.log("Initializing CMO Agent Service...");
const cmoAgent = new CMOAgent();
cmoAgent.start().catch(error => {
  console.error("Failed to start CMO Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'cmo-agent' });
});

// Get all campaigns
app.get('/campaigns', async (req, res, next) => {
  try {
    const campaigns = await cmoAgent.getCampaigns();
    res.status(200).send(campaigns);
  } catch (error) {
    next(error);
  }
});

// Plan and create a new campaign
app.post('/campaigns', async (req, res, next) => {
  try {
    const { brief, budget, startDate, endDate, targetAudience, channels }: CampaignConfig = req.body;
    if (!brief || !budget || !startDate || !endDate || !targetAudience || !channels) {
      return res.status(400).send({ error: 'Missing required fields for campaign creation' });
    }
    const campaign = await cmoAgent.planCampaign(brief, { budget, startDate, endDate, targetAudience, channels });
    res.status(201).send(campaign);
  } catch (error) {
    next(error);
  }
});

// Get market analysis data
app.get('/market/analysis', async (req, res, next) => {
  try {
    const marketAnalysis = await cmoAgent.getMarketAnalysis();
    res.status(200).send(marketAnalysis);
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`CMO Agent Service is running on http://localhost:${PORT}`);
});
