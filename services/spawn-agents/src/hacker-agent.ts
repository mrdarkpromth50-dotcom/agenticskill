import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class HackerAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'HackerAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting hacking task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Scanning target system for vulnerabilities...' });
      const scanReport = await this.useLLM(`Perform a simulated vulnerability scan on the target system described below. Identify potential weaknesses, common exploits, and misconfigurations. Provide a detailed scan report.\n\nTarget System Description:\n${this.taskPayload.description}\n\nAdditional Context:\n${this.taskPayload.context?.details || 'None.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Scan Report: ${scanReport.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 40, message: 'Attempting exploitation of identified vulnerabilities...' });
      const exploitationAttempt = await this.useLLM(`Based on the vulnerability scan report, describe a hypothetical exploitation attempt for one or more critical vulnerabilities. Detail the steps taken and the expected outcome.\n\nScan Report:\n${scanReport}`);
      console.log(`[${this.config.name} Agent ${this.id}] Exploitation Attempt: ${exploitationAttempt.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 70, message: 'Documenting findings and recommending mitigations...' });
      const findingsDocument = await this.useLLM(`Document the findings from the simulated exploitation, including the vulnerability, impact, and clear recommendations for mitigation. Format as a security report.\n\nExploitation Attempt:\n${exploitationAttempt}`);
      console.log(`[${this.config.name} Agent ${this.id}] Findings Document: ${findingsDocument.substring(0, 100)}...`);

      await this.complete({ scanReport, exploitationAttempt, findingsDocument }, 'completed');
      return { success: true, output: findingsDocument };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Hacking task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
