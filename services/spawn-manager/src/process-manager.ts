import { TaskQueue } from "./task-queue";
import { AgentConfig, Task, SpawnedAgent, TaskStatus } from "./types";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

// --- CONFIGURATION ---
const SPAWN_MAX_CONCURRENT = parseInt(process.env.SPAWN_MAX_CONCURRENT || "5", 10);
const TASK_POLLING_INTERVAL = parseInt(process.env.TASK_POLLING_INTERVAL || "5000", 10);
const SPAWN_TASK_TIMEOUT = parseInt(process.env.SPAWN_TASK_TIMEOUT || "300000", 10); // 5 minutes

export class SpawnManager {
  private taskQueue: TaskQueue;
  private availableAgentConfigs: Map<string, AgentConfig> = new Map();
  private spawnedAgents: Map<string, SpawnedAgent> = new Map(); // Key: spawnedAgentId
  private taskListenerInterval: NodeJS.Timeout | null = null;
  private configDir: string;

  constructor(taskQueue: TaskQueue, configDir: string) {
    this.taskQueue = taskQueue;
    this.configDir = path.resolve(configDir);
    console.log(`SpawnManager initialized. Agent configs will be loaded from: ${this.configDir}`);
  }

  async initializeAgentConfigs(): Promise<void> {
    console.log("Loading spawnable agent configurations...");
    const configFiles = await glob(`${this.configDir}/**/*.json`);
    console.log(`Found ${configFiles.length} potential agent config files.`);

    for (const file of configFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const config: AgentConfig = JSON.parse(content);
        if (config.type === "spawn") {
          this.availableAgentConfigs.set(config.id, config);
          console.log(`Loaded spawnable agent config: ${config.name} (ID: ${config.id})`);
        }
      } catch (error) {
        console.error(`Error processing agent config file ${file}:`, error);
      }
    }
    console.log(`Finished loading configs. ${this.availableAgentConfigs.size} spawnable agents available.`);
  }

  startTaskListener(): void {
    if (this.taskListenerInterval) {
      console.warn("Task listener is already running.");
      return;
    }
    console.log(`Starting task listener. Polling interval: ${TASK_POLLING_INTERVAL / 1000}s.`);
    this.taskListenerInterval = setInterval(() => this.processPendingTasks(), TASK_POLLING_INTERVAL);
  }

  stopTaskListener(): void {
    if (this.taskListenerInterval) {
      clearInterval(this.taskListenerInterval);
      this.taskListenerInterval = null;
      console.log("Task listener stopped.");
    }
  }

  private async processPendingTasks(): Promise<void> {
    if (this.spawnedAgents.size >= SPAWN_MAX_CONCURRENT) {
      return; // Max capacity reached
    }

    const task = this.taskQueue.peek(); // Peek first to not remove it from queue yet
    if (!task) {
      return; // No pending tasks
    }

    const agentConfig = this.availableAgentConfigs.get(task.agentType);
    if (!agentConfig) {
      console.error(`No agent config for type '${task.agentType}'. Task ${task.id} will be marked as failed.`);
      this.taskQueue.updateTask(task.id, { status: "failed", error: `Agent type '${task.agentType}' not found.` });
      return;
    }

    // Now that we know we can handle it, officially take it
    this.taskQueue.updateTask(task.id, { status: "in-progress" });
    await this.spawnAgent(agentConfig, task);
  }

  private async spawnAgent(agentConfig: AgentConfig, task: Task): Promise<void> {
    const spawnedAgentId = uuidv4();
    const newAgent: SpawnedAgent = {
      id: spawnedAgentId,
      agentConfig,
      taskId: task.id,
      status: "running",
      spawnedAt: Date.now(),
    };

    this.spawnedAgents.set(spawnedAgentId, newAgent);
    this.taskQueue.updateTask(task.id, { assignedAgentId: spawnedAgentId });
    console.log(`Spawned agent ${agentConfig.name} (Instance ID: ${spawnedAgentId}) for task ${task.id}.`);

    // Simulate the agent performing the work.
    // In a real system, this would involve a child process or container that communicates its status.
    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; // 85% success rate
      if (isSuccess) {
        this.handleTaskCompletion(task.id, { status: "completed", details: `Task payload processed successfully.` });
      } else {
        this.handleTaskFailure(task.id, "A simulated error occurred during task execution.");
      }
      this.terminateAgent(spawnedAgentId);
    }, 5000 + Math.random() * 10000); // Simulate work for 5-15 seconds
  }

  terminateAgent(spawnedAgentId: string): void {
    const agent = this.spawnedAgents.get(spawnedAgentId);
    if (agent) {
      // In a real system, you would kill the child process or stop the container here.
      this.spawnedAgents.delete(spawnedAgentId);
      console.log(`Terminated agent instance ${spawnedAgentId} for task ${agent.taskId}.`);
    } else {
      console.warn(`Attempted to terminate a non-existent agent instance: ${spawnedAgentId}`);
    }
  }

  handleTaskCompletion(taskId: string, result: any): void {
    this.taskQueue.updateTask(taskId, { status: "completed", result });
    console.log(`Task ${taskId} completed successfully.`);
  }

  handleTaskFailure(taskId: string, error: string): void {
    this.taskQueue.updateTask(taskId, { status: "failed", error });
    console.error(`Task ${taskId} failed: ${error}`);
  }

  getActiveAgents(): SpawnedAgent[] {
    return Array.from(this.spawnedAgents.values());
  }
}
