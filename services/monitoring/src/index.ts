import express from 'express';
import { json } from 'body-parser';
import { MetricsCollector } from './metrics-collector';
import { AlertManager } from './alerting';
import { Dashboard } from './dashboard';

const app = express();
app.use(json());

// --- CONFIGURATION ---
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3008;
const METRICS_COLLECTION_INTERVAL = parseInt(process.env.METRICS_COLLECTION_INTERVAL || '10000', 10); // 10 seconds
const ALERT_CHECK_INTERVAL = parseInt(process.env.ALERT_CHECK_INTERVAL || '15000', 10); // 15 seconds

// Define services to monitor (example, should be configurable via env or config file)
const SERVICES_TO_MONITOR = [
  { name: 'memory-system', url: process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001' },
  { name: 'persistent-agent-layer', url: process.env.PERSISTENT_AGENT_LAYER_URL || 'http://persistent-agent-layer:3002' },
  { name: 'spawn-manager', url: process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003' },
  { name: 'ceo-agent', url: process.env.CEO_AGENT_URL || 'http://ceo-agent:3004' },
  { name: 'translation-layer', url: process.env.TRANSLATION_LAYER_URL || 'http://translation-layer:3005' },
  { name: 'account-manager', url: process.env.ACCOUNT_MANAGER_URL || 'http://account-manager:3006' },
  { name: 'spawn-agents', url: process.env.SPAWN_AGENTS_URL || 'http://spawn-agents:3007' },
];

// --- INITIALIZATION ---
console.log('Initializing Monitoring Service...');
const metricsCollector = new MetricsCollector();
const alertManager = new AlertManager({
  serviceDown: true,
  responseTimeHigh: 500, // ms
  cpuUsageHigh: 80, // %
  memoryUsageHigh: 90, // %
}, process.env.ALERT_WEBHOOK_URL);
const dashboard = new Dashboard();

// Start periodic metrics collection
const startMetricsCollection = () => {
  setInterval(async () => {
    metricsCollector.collectSystemMetrics();
    for (const service of SERVICES_TO_MONITOR) {
      await metricsCollector.collectServiceMetrics(service.name, service.url);
    }
  }, METRICS_COLLECTION_INTERVAL);
};

// Start periodic alert checking
const startAlertChecking = () => {
  setInterval(() => {
    const currentMetrics = metricsCollector.getMetrics();
    alertManager.checkThresholds(currentMetrics);
  }, ALERT_CHECK_INTERVAL);
};

startMetricsCollection();
startAlertChecking();

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'monitoring' });
});

// Get all metrics
app.get('/metrics', (req, res) => {
  res.status(200).send(metricsCollector.getMetrics());
});

// Get metrics for a specific service
app.get('/metrics/:serviceName', (req, res) => {
  const serviceMetrics = metricsCollector.getMetricsByService(req.params.serviceName);
  if (serviceMetrics) {
    res.status(200).send(serviceMetrics);
  } else {
    res.status(404).send({ message: 'Service not found or no metrics collected yet.' });
  }
});

// Get active alerts
app.get('/alerts', (req, res) => {
  res.status(200).send(alertManager.getActiveAlerts());
});

// Acknowledge an alert
app.post('/alerts/:id/acknowledge', (req, res) => {
  const acknowledged = alertManager.acknowledgeAlert(req.params.id);
  if (acknowledged) {
    res.status(200).send({ message: `Alert ${req.params.id} acknowledged.` });
  } else {
    res.status(404).send({ message: `Alert ${req.params.id} not found.` });
  }
});

// Monitoring Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const currentMetrics = metricsCollector.getMetrics();
    const activeAlerts = alertManager.getActiveAlerts();
    const html = await dashboard.generateDashboard(currentMetrics, activeAlerts);
    res.status(200).send(html);
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).send('Error generating dashboard');
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Monitoring Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = () => {
  console.log('Shutting down Monitoring Service gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
