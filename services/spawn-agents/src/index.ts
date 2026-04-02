import express from 'express';
import { json } from 'body-parser';
import { BaseSpawnAgent } from './base-agent';
import { DeveloperAgent } from './developer-agent';
import { ResearcherAgent } from './researcher-agent';
import { DesignerAgent } from './designer-agent';
import { CopywriterAgent } from './copywriter-agent';
import { FrontendDeveloperAgent } from './frontend-developer-agent';
import { BackendDeveloperAgent } from './backend-developer-agent';
import { DebuggerAgent } from './debugger-agent';
import { SoftwareTesterAgent } from './software-tester-agent';
import { DevLeadAgent } from './dev-lead-agent';
import { AnalystAgent } from './analyst-agent';
import { HackerAgent } from './hacker-agent';
import { RedTeamAgent } from './redteam-agent';
import { StrategistAgent } from './strategist-agent';
import { SpawnAgentConfig, TaskPayload, AgentFactory, AgentType } from './types';

// Import shared security and resilience modules
import { requestLogger, createRateLimiter, validateApiKey, globalErrorHandler } from '@agenticskill/security';

const app = express();

// --- Apply Shared Middleware ---
app.use(requestLogger);
app.use(json());
app.use(validateApiKey);
app.use(createRateLimiter());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3007;

// In-memory store for spawned agents (for demonstration purposes)
const activeSpawnedAgents: Map<string, BaseSpawnAgent> = new Map();

// Agent factory function
const agentFactory: AgentFactory = {
  'developer': DeveloperAgent,
  'researcher': ResearcherAgent,
  'designer': DesignerAgent,
  'copywriter': CopywriterAgent,
  'frontend-developer': FrontendDeveloperAgent,
  'backend-developer': BackendDeveloperAgent,
  'debugger': DebuggerAgent,
  'software-tester': SoftwareTesterAgent,
  'dev-lead': DevLeadAgent,
  'analyst': AnalystAgent,
  'hacker': HackerAgent,
  'redteam': RedTeamAgent,
  'strategist': StrategistAgent,
};

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'spawn-agents' });
});

// Endpoint to list all available agent types
app.get('/agents/types', (req, res) => {
  const agentTypes = Object.keys(agentFactory) as AgentType[];
  res.status(200).send({ agentTypes });
});

// Endpoint to spawn and execute an agent
app.post('/spawn', async (req, res, next) => {
  const { agentType, taskId, taskPayload, agentConfig }: { agentType: AgentType; taskId: string; taskPayload: TaskPayload; agentConfig: SpawnAgentConfig } = req.body;

  if (!agentType || !taskId || !taskPayload || !agentConfig) {
    return res.status(400).send({ error: 'Missing required fields: agentType, taskId, taskPayload, agentConfig' });
  }

  if (activeSpawnedAgents.has(taskId)) {
    return res.status(409).send({ error: `Agent for task ${taskId} already exists.` });
  }

  const AgentConstructor = agentFactory[agentType];
  if (!AgentConstructor) {
    return res.status(400).send({ error: `Unknown agent type: ${agentType}` });
  }

  try {
    // Create an instance of the specific agent type
    const agent: BaseSpawnAgent = new AgentConstructor(agentConfig, taskId, taskPayload);
    
    // Execute the task in the background, don't wait for it to complete
    agent.executeTask().then(result => {
      console.log(`[Spawn-Agents Service] Agent ${agent.id} for task ${taskId} finished with result:`, result);
      activeSpawnedAgents.delete(taskId);
      // In a real scenario, this would report back to Spawn Manager or CEO Agent
    }).catch(error => {
      console.error(`[Spawn-Agents Service] Agent ${agent.id} for task ${taskId} failed with error:`, error);
      activeSpawnedAgents.delete(taskId);
      // Report failure
    });

    res.status(202).send({ message: `Agent ${agent.id} of type ${agentType} spawned for task ${taskId}` });
  } catch (error) {
    next(error);
  }
});

// Get status of a spawned agent
app.get('/status/:taskId', (req, res, next) => {
  try {
    const { taskId } = req.params;
    const agent = activeSpawnedAgents.get(taskId);
    if (agent) {
      res.status(200).send({ taskId, status: 'running', type: agent.config.type });
    } else {
      res.status(404).send({ error: `Agent for task ${taskId} not found or completed.` });
    }
  } catch (error) {
    next(error);
  }
});

// --- Global Error Handler (MUST be last middleware) ---
app.use(globalErrorHandler);

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Spawn-Agents Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = () => {
  console.log('Shutting down Spawn-Agents Service gracefully...');
  // Terminate any active agents if necessary
  activeSpawnedAgents.forEach(agent => {
    // agent.terminate(); // Assuming a terminate method exists
  });
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
