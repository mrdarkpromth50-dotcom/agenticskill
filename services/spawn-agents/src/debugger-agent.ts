import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class DebuggerAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'DebuggerAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting debugging task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Analyzing error logs...' });
      const errorAnalysis = await this.useLLM(`Analyze the following error logs and code snippet to identify the root cause of the issue. Provide a detailed explanation of the problem.\n\nError Logs:\n${this.taskPayload.context?.logs || 'No logs provided.'}\n\nCode Snippet:\n${this.taskPayload.context?.code || 'No code provided.'}\n\nProblem Description:\n${this.taskPayload.description}`);
      console.log(`[${this.config.name} Agent ${this.id}] Error Analysis: ${errorAnalysis.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 40, message: 'Proposing a fix...' });
      const proposedFix = await this.useLLM(`Based on the error analysis, propose a code fix for the identified issue. Provide only the corrected code snippet.\n\nError Analysis:\n${errorAnalysis}\n\nOriginal Code Snippet:\n${this.taskPayload.context?.code || 'No code provided.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Proposed Fix: ${proposedFix.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 70, message: 'Verifying the fix...' });
      const verificationResult = await this.useLLM(`Review the proposed fix and the original problem. Explain how the fix addresses the root cause and suggest any potential side effects or further improvements.\n\nOriginal Problem Description:\n${this.taskPayload.description}\n\nProposed Fix:\n${proposedFix}`);
      console.log(`[${this.config.name} Agent ${this.id}] Verification Result: ${verificationResult.substring(0, 100)}...`);

      await this.complete({ errorAnalysis, proposedFix, verificationResult }, 'completed');
      return { success: true, output: proposedFix };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Debugging task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
