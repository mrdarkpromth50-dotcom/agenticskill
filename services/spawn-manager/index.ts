import { SpawnManager } from './process-manager';
import { TaskQueue } from './task-queue';
import { AgentConfig } from './types';

async function main() {
  console.log('Starting Spawn Manager Service...');

  const agentConfigs: AgentConfig[] = [
    // Load configurations from config/agents/*.json where type is 'spawn'
    // Example: { id: 'frontend-dev', name: 'Frontend Developer', role: 'Developer', type: 'spawn', ... }
  ];

  const taskQueue = new TaskQueue();
  const spawnManager = new SpawnManager(agentConfigs, taskQueue);

  // Start listening for new tasks (e.g., from CEO Agent via a message queue)
  spawnManager.startTaskListener();

  console.log('Spawn Manager Service started.');
}

main().catch(error => {
  console.error('Spawn Manager Service failed to start:', error);
  process.exit(1);
});
