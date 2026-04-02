import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class DevLeadAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'DevLeadAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting development lead task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Analyzing project scope and breaking down tasks...' });
      const projectAnalysis = await this.useLLM(`Analyze the following project scope and break it down into smaller, manageable tasks suitable for frontend and backend developers. Identify dependencies between tasks.\n\nProject Scope:\n${this.taskPayload.description}\n\nAdditional Context:\n${this.taskPayload.context?.details || 'None.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Project Analysis: ${projectAnalysis.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 40, message: 'Distributing tasks and coordinating efforts...' });
      const taskDistribution = await this.useLLM(`Based on the project analysis, distribute these tasks to hypothetical frontend and backend teams. Outline a coordination plan for integration.\n\nProject Analysis:\n${projectAnalysis}`);
      console.log(`[${this.config.name} Agent ${this.id}] Task Distribution: ${taskDistribution.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 70, message: 'Overseeing integration and code review...' });
      const integrationPlan = await this.useLLM(`Propose a plan for integrating the frontend and backend components, including code review strategies and potential integration points.\n\nTask Distribution:\n${taskDistribution}`);
      console.log(`[${this.config.name} Agent ${this.id}] Integration Plan: ${integrationPlan.substring(0, 100)}...`);

      await this.complete({ projectAnalysis, taskDistribution, integrationPlan }, 'completed');
      return { success: true, output: integrationPlan };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Development lead task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
