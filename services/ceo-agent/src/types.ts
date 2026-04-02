export interface BossCommand {
  text: string;
  sender: string;
  source: 'telegram' | 'discord' | 'api';
}

export interface SubTask {
  id: string;
  description: string;
  assignedAgentType: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  spawnTaskId?: string; // ID from Spawn Manager
}

export interface TaskPlan {
  id: string;
  bossCommand: string;
  overallGoal: string;
  subTasks: SubTask[];
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface CEOStatus {
  status: 'idle' | 'busy' | 'error';
  activePlans: number;
  lastCommand?: string;
}

export interface AgentReport {
  agentId: string;
  taskId: string;
  subTaskId: string;
  status: 'in-progress' | 'completed' | 'failed';
  message: string;
  details?: any;
}
