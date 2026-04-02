import { PersistentAgentManager } from './agent-manager';
import { startHeartbeat } from './heartbeat';
import { AgentConfig } from './types';

// Main entry point for the Persistent Agent Layer service
async function main() {
  console.log('Starting Persistent Agent Layer Service...');

  // Load agent configurations (example, replace with actual loading mechanism)
  const agentConfigs: AgentConfig[] = [
    // Load configurations from config/agents/*.json where type is 'persistent'
    // Example: { id: 'ceo', name: 'CEO Agent', role: 'CEO', type: 'persistent', ... }
  ];

  const manager = new PersistentAgentManager(agentConfigs);
  await manager.initializeAgents();
  startHeartbeat(manager);

  console.log('Persistent Agent Layer Service started.');
}

main().catch(error => {
  console.error('Persistent Agent Layer Service failed to start:', error);
  process.exit(1);
});
