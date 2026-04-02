import { AgentConfig, PersistentAgent, AgentStatus } from "./types";
import { glob } from "glob";
import * as fs from "fs/promises";
import * as path from "path";

export class PersistentAgentManager {
  private agents: Map<string, PersistentAgent> = new Map();
  private configDir: string;

  constructor(configDir: string) {
    // Resolve the absolute path to ensure it works regardless of where the app is started
    this.configDir = path.resolve(configDir);
    console.log(`Agent config directory set to: ${this.configDir}`);
  }

  async initializeAgents(): Promise<void> {
    console.log(`Initializing agents from config directory: ${this.configDir}`);
    const configFiles = await glob(`${this.configDir}/**/*.json`);
    console.log(`Found ${configFiles.length} config files.`);

    for (const file of configFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const config: AgentConfig = JSON.parse(content);

        if (config.type === "persistent") {
          if (this.agents.has(config.id)) {
            console.warn(`Duplicate persistent agent ID found: ${config.id}. Skipping ${file}.`);
            continue;
          }
          this.agents.set(config.id, {
            id: config.id,
            config: config,
            status: "stopped",
            process: null,
          });
          console.log(`Loaded persistent agent config: ${config.name} (ID: ${config.id})`);
        }
      } catch (error) {
        console.error(`Error loading or parsing agent config from ${file}:`, error);
      }
    }
    console.log(`Initialization complete. Loaded ${this.agents.size} persistent agents.`);
  }

  async startAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.error(`Attempted to start non-existent agent: ${agentId}`);
      return false;
    }
    if (agent.status === "running" || agent.status === "starting") {
      console.log(`Agent ${agentId} is already ${agent.status}. No action taken.`);
      return true;
    }

    agent.status = "starting";
    console.log(`Starting agent: ${agent.config.name} (ID: ${agentId})...`);
    try {
      // In a real system, this would spawn a child process or a container.
      // For simulation, we create a mock process object.
      agent.process = { pid: Math.floor(Math.random() * 100000) + 1 };
      agent.status = "running";
      agent.lastHeartbeat = Date.now();
      console.log(`Agent ${agent.config.name} (ID: ${agentId}) started successfully with PID: ${agent.process.pid}.`);
      return true;
    } catch (error) {
      console.error(`Failed to start agent ${agentId}:`, error);
      agent.status = "error";
      agent.process = null;
      return false;
    }
  }

  async stopAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.error(`Attempted to stop non-existent agent: ${agentId}`);
      return false;
    }
    if (agent.status === "stopped" || agent.status === "stopping") {
      console.log(`Agent ${agentId} is already ${agent.status}. No action taken.`);
      return true;
    }

    agent.status = "stopping";
    console.log(`Stopping agent: ${agent.config.name} (ID: ${agentId})...`);
    try {
      if (agent.process) {
        console.log(`Terminating process for agent ${agentId} (PID: ${agent.process.pid})`);
        // In a real system, you would kill the process here.
        agent.process = null;
      }
      agent.status = "stopped";
      console.log(`Agent ${agent.config.name} (ID: ${agentId}) stopped successfully.`);
      return true;
    } catch (error) {
      console.error(`Failed to stop agent ${agentId}:`, error);
      agent.status = "error";
      return false;
    }
  }

  async restartAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.error(`Attempted to restart non-existent agent: ${agentId}`);
      return false;
    }

    console.log(`Restarting agent: ${agent.config.name} (ID: ${agentId})...`);
    agent.status = "restarting";
    
    // Stop the agent first, regardless of its current state (unless already stopping)
    if ((agent.status as string) !== 'stopping' && (agent.status as string) !== 'stopped') {
        await this.stopAgent(agentId);
    }

    // Wait a moment for resources to be released
    await new Promise(resolve => setTimeout(resolve, 500));

    // Start the agent again
    const started = await this.startAgent(agentId);
    if (started) {
        console.log(`Agent ${agentId} restarted successfully.`);
        // The status will be set to 'running' by startAgent
    } else {
        console.error(`Failed to restart agent ${agentId}.`);
        agent.status = "error"; // Set status to error if restart fails
    }
    return started;
  }

  getAgentStatus(agentId: string): { id: string, status: AgentStatus } | undefined {
    const agent = this.agents.get(agentId);
    return agent ? { id: agent.id, status: agent.status } : undefined;
  }

  getAllAgents(): Omit<PersistentAgent, 'process'>[] {
    return Array.from(this.agents.values()).map(({ process, ...rest }) => rest);
  }

  getAgent(agentId: string): PersistentAgent | undefined {
    return this.agents.get(agentId);
  }

  updateAgentHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent && agent.status === "running") {
      agent.lastHeartbeat = Date.now();
      // console.log(`Heartbeat updated for agent ${agentId}`);
    }
  }
}
