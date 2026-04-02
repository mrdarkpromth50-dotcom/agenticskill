import { TaskResult, TaskStatus } from './types';
// @ts-ignore
import axios from 'axios';

export class ResultHandler {
  private taskResults: Map<string, TaskResult> = new Map();

  constructor() {
    console.log("ResultHandler initialized.");
  }

  handleResult(taskId: string, result: any, status: TaskStatus = 'completed', error?: string): void {
    const taskResult: TaskResult = {
      taskId,
      status,
      result,
      error,
      timestamp: Date.now(),
    };
    this.taskResults.set(taskId, taskResult);
    console.log(`Result handled for task ${taskId}: Status - ${status}`);
  }

  getTaskResult(taskId: string): TaskResult | undefined {
    return this.taskResults.get(taskId);
  }

  aggregateResults(taskIds: string[]): TaskResult[] {
    console.log(`Aggregating results for tasks: ${taskIds.join(', ')}`);
    return taskIds.map(taskId => this.taskResults.get(taskId)).filter(Boolean) as TaskResult[];
  }

  async notifyRequester(requesterUrl: string, taskId: string, result: any, status: TaskStatus, error?: string): Promise<void> {
    console.log(`Notifying requester at ${requesterUrl} for task ${taskId}`);
    try {
      await axios.post(requesterUrl, {
        taskId,
        status,
        result,
        error,
      });
      console.log(`Requester notified for task ${taskId}.`);
    } catch (err) {
      console.error(`Failed to notify requester for task ${taskId}:`, err);
    }
  }
}
