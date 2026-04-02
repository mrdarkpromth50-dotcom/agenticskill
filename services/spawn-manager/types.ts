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

export interface Task {
  id: string;
  agentType: string; // The type of agent required to perform this task (e.g., 'frontend-dev', 'debugger')
  description: string;
  payload: any; // Any additional data needed for the task
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedTo?: string; // PID of the spawned agent
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}
