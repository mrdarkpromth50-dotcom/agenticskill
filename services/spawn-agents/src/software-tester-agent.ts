import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class SoftwareTesterAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'SoftwareTesterAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting software testing task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Creating test plan...' });
      const testPlan = await this.useLLM(`Create a comprehensive test plan for the following software feature/module. Include test objectives, scope, types of testing, and entry/exit criteria.\n\nFeature/Module Description:\n${this.taskPayload.description}\n\nAdditional Context:\n${this.taskPayload.context?.details || 'None.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Test Plan: ${testPlan.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 30, message: 'Writing test cases...' });
      const testCases = await this.useLLM(`Based on the test plan, write detailed test cases (e.g., using Jest, Selenium, Cypress) for the following feature. Include preconditions, steps, expected results, and test data.\n\nTest Plan:\n${testPlan}`);
      console.log(`[${this.config.name} Agent ${this.id}] Test Cases: ${testCases.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 60, message: 'Executing tests and identifying bugs...' });
      // In a real scenario, this would involve running actual tests.
      // For now, simulate by asking LLM to identify potential issues based on test cases and code.
      const bugReport = await this.useLLM(`Simulate test execution for the following test cases against the provided code (if any). Identify potential bugs, their severity, and steps to reproduce. Format as a bug report.\n\nTest Cases:\n${testCases}\n\nCode (if available):\n${this.taskPayload.context?.code || 'None.'}`);
      console.log(`[${this.config.name} Agent ${this.id}] Bug Report: ${bugReport.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 80, message: 'Generating test summary...' });
      const testSummary = await this.useLLM(`Summarize the test execution results, including pass/fail rates, critical bugs found, and overall quality assessment.\n\nBug Report:\n${bugReport}`);
      console.log(`[${this.config.name} Agent ${this.id}] Test Summary: ${testSummary.substring(0, 100)}...`);

      await this.complete({ testPlan, testCases, bugReport, testSummary }, 'completed');
      return { success: true, output: testSummary };
    } catch (error) {
      const errorMessage = error instanceof Error ? (error as any).message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Software testing task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
