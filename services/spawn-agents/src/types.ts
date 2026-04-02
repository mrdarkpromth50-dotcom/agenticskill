export interface SpawnAgentConfig {
  id: string;
  name: string;
  type: string; // e.g., 'developer', 'researcher'
  description: string;
  skills: string[];
  tools: string[];
  system_prompt: string;
}

export interface TaskPayload {
  description: string;
  [key: string]: any; // Allow for arbitrary additional task data
}

export interface AgentExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

export interface AgentProgress {
  percentage: number;
  message: string;
}

export type AgentType = 'developer' | 'researcher' | 'designer' | 'copywriter';

export interface AgentFactory {
  [key: string]: any; // Map agentType to constructor
}
