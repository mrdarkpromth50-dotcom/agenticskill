import { PipelineManager } from './pipeline-manager';
import { InfrastructureStatus, PipelineConfig, PipelineRun, ServiceDeployment, InfrastructureReport } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

export class DevOpsAgent {
  private pipelineManager: PipelineManager;
  private infrastructureStatus: Map<string, InfrastructureStatus> = new Map();

  constructor() {
    this.pipelineManager = new PipelineManager();
  }

  public async start(): Promise<void> {
    console.log('DevOps Agent: Starting infrastructure monitoring and pipeline management...');
    // Start periodic infrastructure monitoring
    setInterval(() => this.monitorInfrastructure(), 30 * 1000); // Every 30 seconds
    // Start periodic infrastructure report generation
    setInterval(() => this.generateInfraReport(), 60 * 60 * 1000); // Every hour
  }

  public async monitorInfrastructure(): Promise<void> {
    console.log('DevOps Agent: Monitoring infrastructure...');
    // Simulate checking various infrastructure components
    const components = ['server-web-01', 'database-main', 'load-balancer-prod'];
    for (const component of components) {
      const status: InfrastructureStatus = {
        id: uuidv4(),
        component,
        status: Math.random() > 0.1 ? 'healthy' : 'degraded', // 10% chance of degraded
        details: Math.random() > 0.1 ? undefined : 'High CPU usage detected.',
        timestamp: Date.now(),
      };
      this.infrastructureStatus.set(component, status);
      await this.saveToMemory(status);
    }
  }

  public async managePipeline(config: PipelineConfig): Promise<PipelineConfig> {
    console.log(`DevOps Agent: Managing pipeline: ${config.name}`);
    const pipeline = await this.pipelineManager.createPipeline(config);
    return pipeline;
  }

  public async deployService(serviceName: string, version: string, pipelineId?: string): Promise<ServiceDeployment> {
    console.log(`DevOps Agent: Deploying service ${serviceName} version ${version}...`);
    const deployment: ServiceDeployment = {
      id: uuidv4(),
      serviceName,
      version,
      status: 'deploying',
      timestamp: Date.now(),
    };
    await this.saveToMemory(deployment);

    // Simulate deployment process, potentially involving a pipeline run
    if (pipelineId) {
      await this.pipelineManager.runPipeline(pipelineId);
    }

    setTimeout(async () => {
      deployment.status = Math.random() > 0.2 ? 'success' : 'failed'; // 80% success rate
      deployment.logs = `Simulated deployment logs for ${serviceName} v${version}. Status: ${deployment.status}`;
      await this.saveToMemory(deployment);
      console.log(`DevOps Agent: Deployment of ${serviceName} v${version} finished with status: ${deployment.status}`);
    }, Math.random() * 15000 + 5000); // 5-20 seconds simulation

    return deployment;
  }

  public async rollback(serviceName: string, version: string): Promise<ServiceDeployment> {
    console.log(`DevOps Agent: Rolling back service ${serviceName} to version ${version}...`);
    const rollbackDeployment: ServiceDeployment = {
      id: uuidv4(),
      serviceName,
      version,
      status: 'rolled_back',
      timestamp: Date.now(),
      logs: `Simulated rollback to version ${version} for ${serviceName}.`,
    };
    await this.saveToMemory(rollbackDeployment);
    console.log(`DevOps Agent: Rollback of ${serviceName} to v${version} completed.`);
    return rollbackDeployment;
  }

  public async scaleService(serviceName: string, replicas: number): Promise<void> {
    console.log(`DevOps Agent: Scaling service ${serviceName} to ${replicas} replicas...`);
    // Simulate interaction with Kubernetes or other orchestration system
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate scaling time
    console.log(`DevOps Agent: Service ${serviceName} scaled to ${replicas} replicas.`);
  }

  public async generateInfraReport(): Promise<InfrastructureReport> {
    console.log('DevOps Agent: Generating infrastructure report...');
    const componentStatuses = Array.from(this.infrastructureStatus.values());
    const activePipelines = this.pipelineManager.getAllPipelineRuns().filter(run => run.status === 'running');
    // In a real scenario, fetch recent deployments from memory
    const recentDeployments: ServiceDeployment[] = []; // Placeholder

    const report: InfrastructureReport = {
      date: new Date().toISOString().split('T')[0],
      overallStatus: 'healthy', // Determine based on componentStatuses and activePipelines
      componentStatuses,
      activePipelines,
      recentDeployments,
      recommendations: ['Optimize database queries.', 'Increase monitoring granularity.'],
    };

    if (componentStatuses.some(s => s.status === 'degraded' || s.status === 'unhealthy')) {
      report.overallStatus = 'degraded';
    }
    if (componentStatuses.some(s => s.status === 'unhealthy')) {
      report.overallStatus = 'critical';
    }

    await this.saveToMemory(report);
    console.log('DevOps Agent: Infrastructure report generated and saved.');
    return report;
  }

  public getInfrastructureStatus(): InfrastructureStatus[] {
    return Array.from(this.infrastructureStatus.values());
  }

  public getPipelines(): PipelineConfig[] {
    return this.pipelineManager.getAllPipelines();
  }

  public getPipelineRuns(): PipelineRun[] {
    return this.pipelineManager.getAllPipelineRuns();
  }

  private async saveToMemory(data: InfrastructureStatus | PipelineConfig | PipelineRun | ServiceDeployment | InfrastructureReport): Promise<void> {
    try {
      let dataType: string;
      if ('component' in data) dataType = 'infrastructure_status';
      else if ('stages' in data) dataType = 'pipeline_config';
      else if ('pipelineId' in data) dataType = 'pipeline_run';
      else if ('serviceName' in data) dataType = 'service_deployment';
      else dataType = 'infrastructure_report';

      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'devops-agent',
        data: data,
        embedding: JSON.stringify(data), // Simple embedding for now
        metadata: { type: dataType, id: data.id, timestamp: Date.now() },
      });
      console.log(`DevOps Agent: Saved ${dataType} ${data.id} to long-term memory.`);
    } catch (error) {
      console.error(`DevOps Agent: Failed to save data to memory:`, error);
    }
  }
}
