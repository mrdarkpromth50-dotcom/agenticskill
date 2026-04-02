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

export interface AgentStatus {
  id: string;
  status: 'running' | 'restarting' | 'stopped' | 'failed';
  lastHeartbeat?: number;
}
