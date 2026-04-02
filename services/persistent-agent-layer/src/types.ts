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

export type AgentStatus = 'running' | 'stopped' | 'error' | 'starting' | 'stopping' | 'restarting';

export interface PersistentAgent {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  // In a real implementation, this would be a ChildProcess or similar
  process?: { pid: number } | null;
  lastHeartbeat?: number; // Unix timestamp
}
