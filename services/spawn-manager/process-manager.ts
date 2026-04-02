import { AgentConfig, Task } from './types';
import { TaskQueue } from './task-queue';

const SPAWN_MAX_CONCURRENT = parseInt(process.env.SPAWN_MAX_CONCURRENT || '10', 10);
const SPAWN_TASK_TIMEOUT = parseInt(process.env.SPAWN_TASK_TIMEOUT || '3600000', 10); // 1 hour in ms

export class SpawnManager {
  private spawnedAgents: Map<string, { process: any; config: AgentConfig; taskId: string; timeoutId: NodeJS.Timeout }> = new Map();
  private availableAgentConfigs: Map<string, AgentConfig> = new Map();

  constructor(agentConfigs: AgentConfig[], private taskQueue: TaskQueue) {
    agentConfigs.forEach(config => {
      if (config.type === 'spawn') {
        this.availableAgentConfigs.set(config.id, config);
      }
    });
  }

  startTaskListener() {
    console.log('Spawn Manager: Starting task listener...');
    // In a real system, this would listen to a message queue (e.g., Redis Stream, Kafka)
    // For now, we'll simulate polling or direct task submission.
    setInterval(() => this.processTasks(), 5000); // Poll for tasks every 5 seconds
  }

  private async processTasks() {
    if (this.spawnedAgents.size >= SPAWN_MAX_CONCURRENT) {
      // console.log('Spawn Manager: Max concurrent agents reached. Waiting...');
      return;
    }

    const task = this.taskQueue.getNextTask();
    if (task) {
      console.log(`Spawn Manager: Processing task ${task.id} for agent type ${task.agentType}`);
      const agentConfig = this.availableAgentConfigs.get(task.agentType);
      if (agentConfig) {
        await this.spawnAgent(task, agentConfig);
      } else {
        console.error(`Spawn Manager: No configuration found for agent type: ${task.agentType}`);
        // Optionally, put task back or mark as failed
      }
    }
  }

  private async spawnAgent(task: Task, agentConfig: AgentConfig): Promise<void> {
    if (this.spawnedAgents.size >= SPAWN_MAX_CONCURRENT) {
      console.warn(`Spawn Manager: Cannot spawn agent ${agentConfig.id}. Max concurrent agents reached.`);
      this.taskQueue.addTask(task); // Put task back in queue
      return;
    }

    console.log(`Spawn Manager: Spawning agent ${agentConfig.name} for task ${task.id}...`);
    // Simulate agent spawning (e.g., child process, Docker container)
    const agentProcess = { pid: Math.random().toString(36).substring(7), status: 'running' };

    const timeoutId = setTimeout(() => {
      console.warn(`Spawn Manager: Agent ${agentConfig.id} for task ${task.id} timed out after ${SPAWN_TASK_TIMEOUT / 1000}s. Terminating.`);
      this.terminateAgent(agentProcess.pid);
      // Handle task failure due to timeout
    }, SPAWN_TASK_TIMEOUT);

    this.spawnedAgents.set(agentProcess.pid, { process: agentProcess, config: agentConfig, taskId: task.id, timeoutId });
    console.log(`Spawn Manager: Agent ${agentConfig.id} spawned with PID ${agentProcess.pid} for task ${task.id}.`);

    // In a real system, the spawned agent would then pick up the task and report completion
    // For simulation, we'll auto-complete after a delay
    setTimeout(() => {
      console.log(`Spawn Manager: Agent ${agentConfig.id} (PID ${agentProcess.pid}) completed task ${task.id}.`);
      this.terminateAgent(agentProcess.pid);
      // Report task completion to CEO or relevant service
    }, Math.random() * 30000 + 10000); // Simulate task duration 10-40 seconds
  }

  terminateAgent(pid: string): void {
    const agentEntry = this.spawnedAgents.get(pid);
    if (agentEntry) {
      console.log(`Spawn Manager: Terminating agent with PID ${pid} (Agent: ${agentEntry.config.id}, Task: ${agentEntry.taskId}).`);
      clearTimeout(agentEntry.timeoutId);
      // Simulate process termination
      this.spawnedAgents.delete(pid);
    } else {
      console.warn(`Spawn Manager: Attempted to terminate non-existent agent with PID ${pid}.`);
    }
  }

  getSpawnedAgentCount(): number {
    return this.spawnedAgents.size;
  }

  getSpawnedAgentStatuses(): { pid: string; agentId: string; taskId: string; status: string }[] {
    return Array.from(this.spawnedAgents.entries()).map(([pid, entry]) => ({
      pid,
      agentId: entry.config.id,
      taskId: entry.taskId,
      status: entry.process.status,
    }));
  }
}
