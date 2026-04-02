import express from 'express';
import { json } from 'body-parser';
import { CEOAgent } from './ceo-logic';
import { BossCommand } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3004;

// --- INITIALIZATION ---
console.log("Initializing CEO Agent Service...");
const ceoAgent = new CEOAgent();
ceoAgent.start().catch(error => {
  console.error("Failed to start CEO Agent:", error);
  process.exit(1);
});

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'ceo-agent' });
});

// Get CEO Agent status
app.get('/status', (req, res, next) => {
  try {
    const status = ceoAgent.getStatus();
    res.status(200).send(status);
  } catch (error) {
    next(error);
  }
});

// Get active plans
app.get('/plans', (req, res, next) => {
  try {
    const activePlans = ceoAgent.getActivePlans();
    res.status(200).send(activePlans);
  } catch (error) {
    next(error);
  }
});

// Trigger a report to the boss
app.post('/report', async (req, res, next) => {
  try {
    await ceoAgent.triggerReport();
    res.status(200).send({ message: 'Report triggered successfully' });
  } catch (error) {
    next(error);
  }
});

// Receive command from an external source (e.g., another service or a mock boss)
app.post('/command', async (req, res, next) => {
  try {
    const { text, sender, source }: BossCommand = req.body;
    if (!text || !sender || !source) {
      return res.status(400).send({ error: 'Missing required fields: text, sender, source' });
    }
    await ceoAgent.receiveCommand({ text, sender, source });
    res.status(202).send({ message: 'Command received and being processed' });
  } catch (error) {
    next(error);
  }
});

// New endpoints for proactive features

// Get latest trends
app.get('/trends', (req, res, next) => {
  try {
    const trends = ceoAgent.getLatestTrends();
    res.status(200).send(trends);
  } catch (error) {
    next(error);
  }
});

// Get all stored proposals
app.get('/proposals', async (req, res, next) => {
  try {
    const proposals = await ceoAgent.getStoredProposals();
    res.status(200).send(proposals);
  } catch (error) {
    next(error);
  }
});

// Approve a proposal
app.post('/proposals/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const proposals = await ceoAgent.getStoredProposals();
    const proposalToApprove = proposals.find(p => p.id === id);

    if (!proposalToApprove) {
      return res.status(404).send({ error: `Proposal with ID ${id} not found.` });
    }

    // In a real scenario, you might update the proposal status in memory
    // and then call handleTrendProposal with the approved proposal.
    await ceoAgent.handleTrendProposal(proposalToApprove);
    res.status(200).send({ message: `Proposal ${id} approved and tasks initiated.` });
  } catch (error) {
    next(error);
  }
});

// Get latest daily report
app.get('/reports/daily', (req, res, next) => {
  try {
    const report = ceoAgent.getLatestReport();
    if (report) {
      res.status(200).send(report);
    } else {
      res.status(404).send({ message: 'No daily report available yet.' });
    }
  } catch (error) {
    next(error);
  }
});

// Trigger daily report generation immediately
app.post('/reports/daily/generate', async (req, res, next) => {
  try {
    const report = await ceoAgent.triggerDailyReport();
    res.status(200).send({ message: 'Daily report generated successfully', report });
  } catch (error) {
    next(error);
  }
});

// Trigger trend research immediately
app.post('/research/trigger', async (req, res, next) => {
  try {
    const trends = await ceoAgent.triggerTrendResearch();
    res.status(200).send({ message: 'Trend research triggered successfully', trends });
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`CEO Agent Service is running on http://localhost:${PORT}`);
});
