import { SystemMonitor } from './system-monitor';
import { SystemError, CodePatch, SystemReport } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

interface ServiceConfig {
  name: string;
  url: string;
}

export class CTOAgent {
  private systemMonitor: SystemMonitor;
  private activeErrors: Map<string, SystemError> = new Map();
  private servicesToMonitor: ServiceConfig[] = [
    { name: 'memory-system', url: process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001' },
    { name: 'persistent-agent-layer', url: process.env.PERSISTENT_AGENT_LAYER_URL || 'http://persistent-agent-layer:3002' },
    { name: 'spawn-manager', url: process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003' },
    { name: 'ceo-agent', url: process.env.CEO_AGENT_URL || 'http://ceo-agent:3004' },
    { name: 'translation-layer', url: process.env.TRANSLATION_LAYER_URL || 'http://translation-layer:3005' },
    { name: 'account-manager', url: process.env.ACCOUNT_MANAGER_URL || 'http://account-manager:3006' },
    { name: 'spawn-agents', url: process.env.SPAWN_AGENTS_URL || 'http://spawn-agents:3007' },
    { name: 'antigravity-proxy', url: process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080' },
    { name: 'monitoring', url: process.env.MONITORING_URL || 'http://monitoring:3008' },
    // Add other services as they are implemented
  ];

  constructor() {
    this.systemMonitor = new SystemMonitor(this.servicesToMonitor);
  }

  public async start(): Promise<void> {
    console.log('CTO Agent: Starting system monitoring and error orchestration...');
    const monitoringInterval = parseInt(process.env.SYSTEM_MONITOR_INTERVAL || '30000'); // Default 30 seconds
    this.systemMonitor.startMonitoring(monitoringInterval, this.handleNewError.bind(this));

    // Start periodic system report generation
    setInterval(() => this.generateSystemReport(), 60 * 60 * 1000); // Every hour
  }

  private async handleNewError(error: SystemError): Promise<void> {
    console.log(`CTO Agent: New error detected: ${error.message} in ${error.service}`);
    if (this.activeErrors.has(error.id)) {
      return; // Already tracking this error
    }
    this.activeErrors.set(error.id, { ...error, status: 'investigating' });
    await this.analyzeError(error);
  }

  public async analyzeError(error: SystemError): Promise<void> {
    console.log(`CTO Agent: Analyzing error ${error.id} (${error.level})...`);
    // In a real scenario, use LLM to analyze error details and determine severity/action
    if (error.level === 'critical' || error.level === 'error') {
      await this.spawnDebugger(error);
    } else {
      console.log(`CTO Agent: Error ${error.id} is not critical, logging for review.`);
      // Save to memory for later review
      await this.saveToMemory(error);
    }
  }

  public async spawnDebugger(error: SystemError): Promise<void> {
    console.log(`CTO Agent: Spawning Debugger Agent for error ${error.id}...`);
    try {
      const response = await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: 'debugger-agent',
        description: `Debug critical error in ${error.service}: ${error.message}`,
        payload: { errorId: error.id, service: error.service, errorDetails: error.details },
      });
      console.log(`CTO Agent: Debugger Agent spawned with task ID: ${response.data.id}`);
      // Update error status to reflect that a debugger is working on it
      const updatedError = this.activeErrors.get(error.id);
      if (updatedError) {
        this.activeErrors.set(error.id, { ...updatedError, status: 'investigating', details: { ...updatedError.details, debuggerTaskId: response.data.id } });
      }
    } catch (spawnError) {
      console.error(`CTO Agent: Failed to spawn Debugger Agent for error ${error.id}:`, spawnError);
      // Mark error as unresolvable by debugger for now
      const updatedError = this.activeErrors.get(error.id);
      if (updatedError) {
        this.activeErrors.set(error.id, { ...updatedError, status: 'failed_spawn_debugger' });
      }
    }
  }

  public async reviewCode(patch: CodePatch): Promise<void> {
    console.log(`CTO Agent: Reviewing code patch ${patch.id} for task ${patch.taskId}...`);
    // In a real scenario, use LLM to review code quality, security, and correctness
    // For now, simulate approval
    const isApproved = Math.random() > 0.2; // 80% chance of approval
    if (isApproved) {
      patch.status = 'approved';
      console.log(`CTO Agent: Code patch ${patch.id} approved.`);
      await this.approveAndMerge(patch);
    } else {
      patch.status = 'rejected';
      patch.reviewComments = 'Needs more robust error handling and unit tests.';
      console.log(`CTO Agent: Code patch ${patch.id} rejected. Comments: ${patch.reviewComments}`);
      // Notify debugger agent to revise
    }
    await this.saveToMemory(patch);
  }

  public async approveAndMerge(patch: CodePatch): Promise<void> {
    console.log(`CTO Agent: Approving and merging code patch ${patch.id}...`);
    // In a real scenario, this would interact with a Git repository (e.g., GitHub API)
    // For now, simulate merge
    patch.status = 'merged';
    console.log(`CTO Agent: Code patch ${patch.id} merged successfully.`);
    // Remove the error from active errors if it was resolved by this patch
    const errorId = patch.details?.errorId; // Assuming errorId is passed in patch details
    if (errorId && this.activeErrors.has(errorId)) {
      this.activeErrors.delete(errorId);
      console.log(`CTO Agent: Error ${errorId} resolved and removed from active errors.`);
    }
    await this.saveToMemory(patch);
  }

  public async generateSystemReport(): Promise<SystemReport> {
    console.log('CTO Agent: Generating daily system report...');
    const serviceStatuses = await Promise.all(this.servicesToMonitor.map(async service => {
      try {
        const response = await axios.get(`${service.url}/health`);
        return { serviceName: service.name, status: response.data.status === 'ok' ? 'up' : 'degraded' };
      } catch (error) {
        return { serviceName: service.name, status: 'down', message: error instanceof Error ? error.message : String(error) };
      }
    }));

    const report: SystemReport = {
      date: new Date().toISOString().split('T')[0],
      overallStatus: 'healthy', // Determine based on serviceStatuses and activeErrors
      serviceStatuses: serviceStatuses,
      recentErrors: Array.from(this.activeErrors.values()),
      performanceMetrics: { cpuUsage: Math.random() * 100, memoryUsage: Math.random() * 100, networkTraffic: Math.random() * 1000 }, // Simulated
    };

    if (report.serviceStatuses.some(s => s.status === 'down' || s.status === 'degraded') || report.recentErrors.length > 0) {
      report.overallStatus = 'degraded';
    }
    if (report.serviceStatuses.some(s => s.status === 'down' && s.service === 'memory-system') || report.recentErrors.some(e => e.level === 'critical')) {
      report.overallStatus = 'critical';
    }

    await this.saveToMemory(report);
    console.log('CTO Agent: System Report Generated:', report);
    return report;
  }

  public async saveToMemory(data: SystemError | CodePatch | SystemReport): Promise<void> {
    try {
      const dataType = 'status' in data ? 'system_report' : ('message' in data ? 'system_error' : 'code_patch');
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'cto-agent',
        data: data,
        embedding: JSON.stringify(data), // Simple embedding for now
        metadata: { type: dataType, id: data.id, timestamp: Date.now() },
      });
      console.log(`CTO Agent: Saved ${dataType} ${data.id} to long-term memory.`);
    } catch (error) {
      console.error(`CTO Agent: Failed to save data to memory:`, error);
    }
  }

  public getSystemStatus(): { overallStatus: string; activeErrors: SystemError[] } {
    return { overallStatus: this.generateSystemReport().then(r => r.overallStatus).catch(() => 'unknown'), activeErrors: Array.from(this.activeErrors.values()) };
  }

  public getErrors(): SystemError[] {
    return Array.from(this.activeErrors.values());
  }
}
