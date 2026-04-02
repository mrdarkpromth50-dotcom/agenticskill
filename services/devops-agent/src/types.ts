export interface InfrastructureStatus {
  id: string;
  component: string; // e.g., 'server', 'database', 'load_balancer'
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: string;
  timestamp: number;
}

export interface PipelineConfig {
  id: string;
  name: string;
  repository: string;
  branch: string;
  stages: { name: string; commands: string[] }[];
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  logs?: string;
}

export interface ServiceDeployment {
  id: string;
  serviceName: string;
  version: string;
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  timestamp: number;
  logs?: string;
}

export interface InfrastructureReport {
  date: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  componentStatuses: InfrastructureStatus[];
  activePipelines: PipelineRun[];
  recentDeployments: ServiceDeployment[];
  recommendations: string[];
}
