import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class StrategistAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'StrategistAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting strategist task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Analyzing market data and trends...' });
      const marketAnalysis = await this.useLLM(`Analyze the current market data and trends relevant to the following business objective. Identify key opportunities and threats.\n\nBusiness Objective:\n${this.taskPayload.description}\n\nAdditional Context:\n${this.taskPayload.context?.details || 'None.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Market Analysis: ${marketAnalysis.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 40, message: 'Developing strategic recommendations...' });
      const strategyDocument = await this.useLLM(`Based on the market analysis, develop a strategic document outlining actionable recommendations to achieve the business objective. Include potential risks and mitigation strategies.\n\nMarket Analysis:\n${marketAnalysis}`);
      console.log(`[${this.config.name} Agent ${this.id}] Strategy Document: ${strategyDocument.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 70, message: 'Preparing presentation for stakeholders...' });
      const presentationOutline = await this.useLLM(`Create an outline for a presentation to key stakeholders, summarizing the strategic recommendations and their potential impact. Focus on clarity and persuasiveness.\n\nStrategy Document:\n${strategyDocument}`);
      console.log(`[${this.config.name} Agent ${this.id}] Presentation Outline: ${presentationOutline.substring(0, 100)}...`);

      await this.complete({ marketAnalysis, strategyDocument, presentationOutline }, 'completed');
      return { success: true, output: strategyDocument };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Strategist task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
