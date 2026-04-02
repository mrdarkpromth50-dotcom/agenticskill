import express from 'express';
import { json } from 'body-parser';
import { CEOAgent } from './ceo-logic';
import { BossCommand } from './types';

const app = express();
app.use(json());

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
app.get('/status', (req, res) => {
  try {
    const status = ceoAgent.getStatus();
    res.status(200).send(status);
  } catch (error) {
    console.error('[API ERROR] GET /status:', error);
    res.status(500).send({ error: 'Internal server error while retrieving CEO status' });
  }
});

// Get active plans
app.get('/plans', (req, res) => {
  try {
    const activePlans = ceoAgent.getActivePlans();
    res.status(200).send(activePlans);
  } catch (error) {
    console.error('[API ERROR] GET /plans:', error);
    res.status(500).send({ error: 'Internal server error while retrieving active plans' });
  }
});

// Trigger a report to the boss
app.post('/report', async (req, res) => {
  try {
    await ceoAgent.triggerReport();
    res.status(200).send({ message: 'Report triggered successfully' });
  } catch (error) {
    console.error('[API ERROR] POST /report:', error);
    res.status(500).send({ error: 'Internal server error while triggering report' });
  }
});

// Receive command from an external source (e.g., another service or a mock boss)
app.post('/command', async (req, res) => {
  try {
    const { text, sender, source }: BossCommand = req.body;
    if (!text || !sender || !source) {
      return res.status(400).send({ error: 'Missing required fields: text, sender, source' });
    }
    await ceoAgent.receiveCommand({ text, sender, source });
    res.status(202).send({ message: 'Command received and being processed' });
  } catch (error) {
    console.error('[API ERROR] POST /command:', error);
    res.status(500).send({ error: 'Internal server error while processing command' });
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`CEO Agent Service is running on http://localhost:${PORT}`);
});
