import { PersistentAgentManager } from "./agent-manager";

export class HeartbeatService {
  private manager: PersistentAgentManager;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number;
  private autoRestart: boolean;

  constructor(manager: PersistentAgentManager, interval: number = 30000, autoRestart: boolean = true) {
    this.manager = manager;
    this.checkInterval = interval;
    this.autoRestart = autoRestart;
  }

  start(): void {
    if (this.intervalId) {
      console.warn("Heartbeat service is already running.");
      return;
    }

    console.log(`Starting heartbeat service. Check interval: ${this.checkInterval / 1000}s, Auto-restart: ${this.autoRestart}`);
    this.intervalId = setInterval(() => this.checkAgents(), this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Heartbeat service stopped.");
    }
  }

  private async checkAgents(): Promise<void> {
    console.log("Heartbeat: Checking status of all persistent agents...");
    const agents = this.manager.getAllAgents();

    for (const agent of agents) {
      // We only care about agents that are supposed to be running.
      if (agent.status === "running") {
        const agentInstance = this.manager.getAgent(agent.id);
        if (!agentInstance) continue;

        const lastHeartbeat = agentInstance.lastHeartbeat || 0;
        const timeSinceHeartbeat = Date.now() - lastHeartbeat;
        const heartbeatThreshold = this.checkInterval * 2; // Allow for 2 missed heartbeats

        // In a real system, we would ping the agent process. Here we simulate by checking the last heartbeat time.
        // The agent process itself would be responsible for updating its heartbeat.
        if (timeSinceHeartbeat > heartbeatThreshold) {
          console.warn(`Heartbeat missed for agent ${agent.id} (${agent.config.name}). Last seen ${Math.round(timeSinceHeartbeat / 1000)}s ago.`);
          if (this.autoRestart) {
            console.log(`Auto-restarting agent ${agent.id}...`);
            await this.manager.restartAgent(agent.id);
          }
        }
      } else if (agent.status === "error") {
        console.error(`Agent ${agent.id} (${agent.config.name}) is in an error state.`);
        if (this.autoRestart) {
          console.log(`Auto-restarting agent ${agent.id} from error state...`);
          await this.manager.restartAgent(agent.id);
        }
      }
    }
    console.log("Heartbeat check complete.");
  }
}
