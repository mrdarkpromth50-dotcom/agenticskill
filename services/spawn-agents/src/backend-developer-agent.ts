import { BaseSpawnAgent } from './base-agent';
import { AgentExecutionResult, TaskPayload } from './types';

export class BackendDeveloperAgent extends BaseSpawnAgent {
  constructor(config: any, taskId: string, taskPayload: TaskPayload) {
    super(config, taskId, taskPayload);
    this.config.name = this.config.name || 'BackendDeveloperAgent';
  }

  public async executeTask(): Promise<AgentExecutionResult> {
    console.log(`[${this.config.name} Agent ${this.id}] Starting backend development task: ${this.taskPayload.description}`);
    try {
      await this.reportProgress({ percentage: 10, message: 'Analyzing API requirements...' });
      const apiRequirements = await this.useLLM(`Analyze the following API requirements and propose a high-level design for a backend service using ${this.config.skill || 'Node.js'}:\n\n${this.taskPayload.description}`);
      console.log(`[${this.config.name} Agent ${this.id}] API Requirements Analysis: ${apiRequirements.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 30, message: 'Designing database schema...' });
      const dbSchema = await this.useLLM(`Based on the API requirements, design a detailed database schema (SQL or NoSQL) for the backend service. Provide only the schema definition.\n\n${apiRequirements}`);
      console.log(`[${this.config.name} Agent ${this.id}] Database Schema: ${dbSchema.substring(0, 100)}...`);

      await this.reportProgress({ percentage: 60, message: 'Implementing API endpoints...' });
      const apiCode = await this.useLLM(`Implement the API endpoints for the backend service using ${this.config.skill || 'Node.js'} and Express. Use the following database schema. Provide only the code.\n\nDatabase Schema:\n${dbSchema}\n\nAPI Requirements:\n${apiRequirements}`);
      console.log(`[${this.config.name} Agent ${this.id}] API Code generated.`);

      await this.reportProgress({ percentage: 80, message: 'Writing API tests...' });
      const apiTests = await this.useLLM(`Write unit and integration tests for the generated API code using Jest. Provide only the test code.\n\nAPI Code:\n${apiCode}`);
      console.log(`[${this.config.name} Agent ${this.id}] API Tests generated.`);

      await this.complete({ apiCode, dbSchema, apiRequirements, apiTests }, 'completed');
      return { success: true, output: apiCode };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name} Agent ${this.id}] Backend development task failed: ${errorMessage}`);
      await this.complete(null, 'failed', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}
