import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class AnalystAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'AnalystAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting data analysis task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Collecting and cleaning data...' });
      const dataCollectionPlan = await this.useLLM(`Outline a plan to collect and clean data relevant to the following analysis request. Specify potential data sources and cleaning steps.\n\nAnalysis Request:\n${this.taskPayload.description}\n\nData Context:\n${this.taskPayload.context?.data || 'No specific data provided.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Data Collection Plan: ${dataCollectionPlan.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 40, message: 'Analyzing patterns and trends...' });
      const analysisReport = await this.useLLM(`Based on the collected data (simulated) and the analysis request, identify key patterns, trends, and insights. Provide a detailed report.\n\nAnalysis Request:\n${this.taskPayload.description}\n\nSimulated Data Context:\n${this.taskPayload.context?.data || 'Sample data points related to the request.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Analysis Report: ${analysisReport.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 70, message: 'Creating data visualizations...' });
      const visualizationsDescription = await this.useLLM(`Based on the analysis report, describe suitable data visualizations (e.g., charts, graphs) that would effectively communicate the key insights. Specify chart types and what they would represent.\n\nAnalysis Report:\n${analysisReport}`);
      console.log(`[${this.config.name} Agent ${this.id}] Visualizations Description: ${visualizationsDescription.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 90, message: 'Summarizing insights...' });
      const summary = await this.useLLM(`Provide a concise summary of the key insights and recommendations derived from the data analysis.\n\nAnalysis Report:\n${analysisReport}`);
      console.log(`[${this.config.name} Agent ${this.id}] Summary: ${summary.substring(0, 100)}...`);

      await this.complete({ dataCollectionPlan, analysisReport, visualizationsDescription, summary }, 'completed');
      return { success: true, output: summary };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Data analysis task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
