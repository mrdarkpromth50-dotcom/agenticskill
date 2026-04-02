export interface SystemError {
  errorId?: string;
  id: string;
  service: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  timestamp: number;
  details?: any;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
}

export interface CodePatch {
  id: string;
  taskId: string; // ID of the debugger agent task
  description: string;
  files: { filename: string; content: string }[];
  status: 'pending_review' | 'approved' | 'rejected' | 'merged';
  reviewerId?: string;
  reviewComments?: string;
}

export interface SystemReport {
  date: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  serviceStatuses: { serviceName: string; status: 'up' | 'down' | 'degraded'; message?: string }[];
  recentErrors: SystemError[];
  performanceMetrics: { cpuUsage: number; memoryUsage: number; networkTraffic: number };
}

