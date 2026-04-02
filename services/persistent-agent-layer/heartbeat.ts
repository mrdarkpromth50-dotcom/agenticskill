import { PersistentAgentManager } from './agent-manager';

const HEARTBEAT_INTERVAL = parseInt(process.env.PERSISTENT_AGENT_HEARTBEAT_INTERVAL || '30000', 10);
const AUTO_RESTART_ENABLED = process.env.PERSISTENT_AGENT_AUTO_RESTART === 'true';

export function startHeartbeat(manager: PersistentAgentManager) {
  console.log(`Starting persistent agent heartbeat with interval: ${HEARTBEAT_INTERVAL}ms`);
  setInterval(async () => {
    const statuses = manager.getAllAgentStatuses();
    for (const agent of statuses) {
      if (agent.status !== 'running') {
        console.warn(`Persistent agent ${agent.id} is not running. Current status: ${agent.status}`);
        if (AUTO_RESTART_ENABLED) {
          console.log(`Attempting to auto-restart agent ${agent.id}...`);
          await manager.restartAgent(agent.id);
        }
      }
    }
  }, HEARTBEAT_INTERVAL);
}
