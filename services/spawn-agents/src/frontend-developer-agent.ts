import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class FrontendDeveloperAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'FrontendDeveloperAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting frontend development task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Analyzing UI requirements...' });
      const analysis = await this.useLLM(`Analyze the following UI requirements and propose a component structure for a web application using ${this.config.skill || 'React'}:\n\n${this.taskPayload.description}`);
      console.log(`[${this.config.name} Agent ${this.id}] UI Analysis: ${analysis.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 30, message: 'Designing component structure...' });
      const componentStructure = await this.useLLM(`Based on this UI analysis, design a detailed component structure, including component names, props, and hierarchy, for a ${this.config.skill || 'React'} application:\n\n${analysis}`);
      console.log(`[${this.config.name} Agent ${this.id}] Component Structure: ${componentStructure.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 60, message: 'Implementing UI code...' });
      const uiCode = await this.useLLM(`Implement the UI code for the following component structure using ${this.config.skill || 'React'} and TailwindCSS. Focus on a clean, modular design. Provide only the code.\n\n${componentStructure}`);
      console.log(`[${this.config.name} Agent ${this.id}] UI Code generated.`);

      await this.reportProgress({ percentage: 80, message: 'Testing responsiveness...' });
      const testResult = await this.useLLM(`Review the following UI code and provide feedback on its responsiveness and adherence to best practices. Suggest improvements if any.\n\n${uiCode}`);
      console.log(`[${this.config.name} Agent ${this.id}] Responsiveness Test Result: ${testResult.substring(0, 100)}...`);

      await this.complete({ uiCode, analysis, componentStructure, testResult }, 'completed');
      return { success: true, output: uiCode };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Frontend development task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
