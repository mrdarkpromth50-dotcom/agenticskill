import { PipelineConfig, PipelineRun } from './types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

export class PipelineManager {
  private pipelines: Map<string, PipelineConfig> = new Map();
  private pipelineRuns: Map<string, PipelineRun> = new Map();

  constructor() {
    // In a real scenario, load existing pipelines and runs from memory
  }

  public async createPipeline(config: PipelineConfig): Promise<PipelineConfig> {
    console.log(`Pipeline Manager: Creating new pipeline: ${config.name}`);
    const newPipeline: PipelineConfig = {
      id: uuidv4(),
      ...config,
    };
    this.pipelines.set(newPipeline.id, newPipeline);
    await this.saveToMemory(newPipeline);
    return newPipeline;
  }

  public async runPipeline(pipelineId: string): Promise<PipelineRun | undefined> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      console.warn(`Pipeline Manager: Pipeline ${pipelineId} not found.`);
      return undefined;
    }

    console.log(`Pipeline Manager: Running pipeline ${pipeline.name} (${pipelineId})...`);
    const newRun: PipelineRun = {
      id: uuidv4(),
      pipelineId: pipeline.id,
      status: 'running',
      startTime: Date.now(),
    };
    this.pipelineRuns.set(newRun.id, newRun);
    await this.saveToMemory(newRun);

    // Simulate pipeline execution
    setTimeout(async () => {
      const status = Math.random() > 0.3 ? 'success' : 'failed'; // 70% success rate
      newRun.status = status;
      newRun.endTime = Date.now();
      newRun.logs = `Simulated pipeline run logs for ${pipeline.name}. Status: ${status}`;
      console.log(`Pipeline Manager: Pipeline ${pipeline.name} run ${newRun.id} finished with status: ${status}`);
      await this.saveToMemory(newRun);
    }, Math.random() * 10000 + 5000); // 5-15 seconds simulation

    return newRun;
  }

  public getPipelineStatus(runId: string): PipelineRun | undefined {
    return this.pipelineRuns.get(runId);
  }

  public getAllPipelines(): PipelineConfig[] {
    return Array.from(this.pipelines.values());
  }

  public getAllPipelineRuns(): PipelineRun[] {
    return Array.from(this.pipelineRuns.values());
  }

  private async saveToMemory(data: PipelineConfig | PipelineRun): Promise<void> {
    try {
      const dataType = 'stages' in data ? 'pipeline_config' : 'pipeline_run';
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'devops-agent',
        data: data,
        embedding: JSON.stringify(data), // Simple embedding for now
        metadata: { type: dataType, id: data.id, timestamp: Date.now() },
      });
      console.log(`DevOps Agent: Saved ${dataType} ${data.id} to long-term memory.`);
    } catch (error) {
      console.error(`DevOps Agent: Failed to save ${dataType} to memory:`, error);
    }
  }
}
