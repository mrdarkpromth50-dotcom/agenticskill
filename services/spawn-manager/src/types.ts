export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  agentType: string; // The type of agent required to perform this task (e.g., 'frontend-dev', 'debugger')
  description: string;
  payload: any; // Any additional data needed for the task
  status: TaskStatus;
  assignedAgentId?: string; // ID of the spawned agent that took this task
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: any; // Result of the task upon completion
  error?: string; // Error message if task failed
  requesterCallbackUrl?: string; // URL to notify the requester upon task completion/failure
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  type: 'persistent' | 'spawn';
  personality: string;
  communication_style: string;
  skills: string[];
  tools: string[];
  system_prompt: string;
}

export interface SpawnedAgent {
  id: string; // Unique ID for this spawned instance
  agentConfig: AgentConfig; // The configuration of the agent type
  taskId: string; // The ID of the task this agent is handling
  pid?: number; // Process ID if applicable
  status: 'running' | 'idle' | 'terminated' | 'error';
  spawnedAt: number;
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  timestamp: number;
}
