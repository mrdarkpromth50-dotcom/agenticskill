import express from 'express';
import { json } from 'body-parser';
import { BaseSpawnAgent } from './base-agent';
import { DeveloperAgent } from './developer-agent';
import { ResearcherAgent } from './researcher-agent';
import { DesignerAgent } from './designer-agent';
import { CopywriterAgent } from './copywriter-agent';
import { SpawnAgentConfig, TaskPayload, AgentFactory } from './types';

const app = express();
app.use(json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3007;

// --- Agent Factory ---
const agentFactory: AgentFactory = {
  'developer': DeveloperAgent,
  'researcher': ResearcherAgent,
  'designer': DesignerAgent,
  'copywriter': CopywriterAgent,
};

// --- API ENDPOINTS ---

// Health check
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok', service: 'spawn-agents' });
});

// Endpoint to spawn and execute an agent
app.post('/spawn', async (req, res) => {
  const { agentType, taskId, taskPayload, agentConfig }: { agentType: string; taskId: string; taskPayload: TaskPayload; agentConfig: SpawnAgentConfig } = req.body;

  if (!agentType || !taskId || !taskPayload || !agentConfig) {
    return res.status(400).send({ error: 'Missing required fields: agentType, taskId, taskPayload, agentConfig' });
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
    }).catch(error => {
      console.error(`[Spawn-Agents Service] Agent ${agent.id} for task ${taskId} failed with error:`, error);
      // The agent itself should report failure to Spawn Manager, but this catches unexpected errors
    });

    res.status(202).send({ message: `Agent ${agent.id} of type ${agentType} spawned for task ${taskId}` });
  } catch (error) {
    console.error('[API ERROR] POST /spawn:', error);
    res.status(500).send({ error: 'Internal server error while spawning agent' });
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Spawn-Agents Service is running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = () => {
  console.log('Shutting down Spawn-Agents Service gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
