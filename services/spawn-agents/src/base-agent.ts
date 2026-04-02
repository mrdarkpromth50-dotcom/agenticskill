import axios, { AxiosError } from 'axios';
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

  protected async useLLM(prompt: string, model?: string, maxTokens?: number, temperature?: number, stream?: boolean, translateToEnglish?: boolean): Promise<string> {
    console.log(`[${this.config.name} Agent ${this.id}] Calling LLM via Antigravity Proxy...`);
    const maxRetries = 3;
    const initialRetryDelay = 1000; // 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
          prompt: prompt,
          model: model || 'default',
          maxTokens: maxTokens || 2000,
          temperature: temperature || 0.7,
          stream: stream || false,
          translateToEnglish: translateToEnglish || false,
        });
        return response.data.text.trim();
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error(`[${this.config.name} Agent ${this.id}] Error calling LLM (Attempt ${attempt + 1}/${maxRetries}):`, axiosError.message);

        if (axiosError.response) {
          console.error(`Status: ${axiosError.response.status}, Data: ${JSON.stringify(axiosError.response.data)}`);
          // If it's a client error (4xx) other than 429, or a non-retryable server error, rethrow immediately
          if (axiosError.response.status >= 400 && axiosError.response.status < 500 && axiosError.response.status !== 429) {
            throw new Error(`LLM Proxy returned client error: ${axiosError.response.status} - ${axiosError.response.data.error || axiosError.message}`);
          }
        }

        if (attempt < maxRetries - 1) {
          const delay = initialRetryDelay * Math.pow(2, attempt);
          console.log(`Retrying LLM call in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error(`Failed to get response from LLM after ${maxRetries} attempts: ${axiosError.message}`);
        }
      }
    }
    throw new Error('Unexpected error in useLLM retry loop.'); // Should not be reached
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
