import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { SpawnAgentConfig, TaskPayload, AgentExecutionResult, AgentProgress } from './types';

const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';
const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';

export abstract class BaseSpawnAgent {
  protected id: string;
  protected config: SpawnAgentConfig;
  protected taskId: string;
  protected taskPayload: TaskPayload;

  constructor(config: SpawnAgentConfig, taskId: string, taskPayload: TaskPayload) {
    this.id = uuidv4();
    this.config = config;
    this.taskId = taskId;
    this.taskPayload = taskPayload;
    console.log(`[${this.config.name} Agent ${this.id}] Initialized for task ${this.taskId}`);
  }

  public abstract executeTask(): Promise<AgentExecutionResult>;

  protected async useLLM(prompt: string, model?: string): Promise<string> {
    console.log(`[${this.config.name} Agent ${this.id}] Calling LLM via Antigravity Proxy...`);
    try {
      const response = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
        prompt: prompt,
        model: model || 'default',
        max_tokens: 2000,
        temperature: 0.7,
      });
      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error(`[${this.config.name} Agent ${this.id}] Error calling LLM:`, error);
      throw new Error(`Failed to get response from LLM: ${error.message}`);
    }
  }

  protected async reportProgress(progress: AgentProgress): Promise<void> {
    console.log(`[${this.config.name} Agent ${this.id}] Reporting progress: ${progress.percentage}% - ${progress.message}`);
    try {
      await axios.put(`${SPAWN_MANAGER_URL}/tasks/${this.taskId}/status`, {
        status: 'in-progress',
        result: { progress },
      });
    } catch (error) {
      console.error(`[${this.config.name} Agent ${this.id}] Failed to report progress:`, error);
    }
  }

  protected async complete(result: any, status: 'completed' | 'failed' = 'completed', error?: string): Promise<void> {
    console.log(`[${this.config.name} Agent ${this.id}] Task ${this.taskId} ${status}.`);
    try {
      await axios.put(`${SPAWN_MANAGER_URL}/tasks/${this.taskId}/status`, {
        status: status,
        result: result,
        error: error,
      });
    } catch (err) {
      console.error(`[${this.config.name} Agent ${this.id}] Failed to report completion:`, err);
    }
  }
}
