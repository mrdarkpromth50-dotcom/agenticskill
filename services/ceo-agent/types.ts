export interface CEOAgentConfig {
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

export interface BossCommand {
  text: string;
  sender: string;
}

export interface SubTask {
  id: string;
  description: string;
  assignedAgentType: string; // e.g., 'frontend-dev', 'debugger', 'ceo'
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface TaskPlan {
  id: string;
  bossCommand: string;
  overallGoal: string;
  subTasks: SubTask[];
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface AgentReport {
  agentId: string;
  taskId: string;
  subTaskId: string;
  status: 'in-progress' | 'completed' | 'failed';
  message: string;
  details?: any;
}

export interface TrendProposal {
  title: string;
  description: string;
  potentialImpact: string;
  recommendation: string;
}
