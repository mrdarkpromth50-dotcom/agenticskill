export interface BossCommand {
  text: string;
  sender: string;
  source: 'telegram' | 'discord' | 'api';
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  description: string;
  agentType: string;
  dependencies: string[]; // Array of task IDs that this task depends on
  estimatedTime?: number; // in hours
  estimatedCost?: number; // in USD
  status: TaskStatus;
  assignedAgentId?: string;
  result?: any;
  error?: string;
  spawnTaskId?: string; // ID from Spawn Manager
  startTime?: number;
  endTime?: number;
}

export interface ExecutionPlan {
  id: string;
  bossCommand: string;
  overallGoal: string;
  tasks: Task[];
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface ProgressReport {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  failedTasks: number;
  overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  completionPercentage: number;
}

export interface CEOStatus {
  status: 'idle' | 'busy' | 'error';
  activePlans: number;
  lastCommand?: string;
  overallProgress?: ProgressReport;
}

export interface AgentReport {
  agentId: string;
  taskId: string;
  subTaskId: string;
  status: 'in-progress' | 'completed' | 'failed';
  message: string;
  details?: any;
}

// New interfaces for Trend Research, Daily Report, and Proactive Scheduler
export interface TrendItem {
  title: string;
  summary: string;
  implications: string;
}

export interface Proposal {
  id: string;
  title: string;
  summary: string;
  impact: 'low' | 'medium' | 'high';
  actionItems: string[];
  estimatedCost: 'low' | 'medium' | 'high' | string;
  estimatedTime: 'short-term' | 'medium-term' | 'long-term' | string;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export interface DailyReport {
  title: string;
  date: string;
  summary: string;
  agentActivitiesSummary: string;
  taskStatusSummary: string;
  financialAlerts: string;
  keyAchievements: string;
}

export interface ProactiveConfig {
  trendResearchInterval: number; // in milliseconds
  dailyReportCronTime: string; // cron string
  idleCheckInterval: number; // in milliseconds
}
