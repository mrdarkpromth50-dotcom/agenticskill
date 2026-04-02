import { AgentConfig } from './types';

export class AgentPool {
  private agentTypes: Map<string, AgentConfig> = new Map();

  constructor() {
    console.log("AgentPool initialized.");
  }

  registerAgentType(type: string, config: AgentConfig): void {
    if (this.agentTypes.has(type)) {
      console.warn(`Agent type ${type} already registered. Overwriting.`);
    }
    this.agentTypes.set(type, config);
    console.log(`Agent type registered: ${type}`);
  }

  getAgentType(type: string): AgentConfig | undefined {
    return this.agentTypes.get(type);
  }

  getAvailableTypes(): string[] {
    return Array.from(this.agentTypes.keys());
  }

  getPoolStats(): { totalTypes: number; types: { [key: string]: AgentConfig } } {
    return {
      totalTypes: this.agentTypes.size,
      types: Object.fromEntries(this.agentTypes)
    };
  }
}
