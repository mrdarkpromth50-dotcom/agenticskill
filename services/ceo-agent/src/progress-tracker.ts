import { Task, TaskStatus, ProgressReport } from './types';

export class ProgressTracker {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    console.log("ProgressTracker initialized.");
  }

  trackTask(task: Task): void {
    if (this.tasks.has(task.id)) {
      console.warn(`Task ${task.id} is already being tracked. Updating existing task.`);
    }
    this.tasks.set(task.id, { ...task });
    console.log(`Tracking task: ${task.id} - ${task.description}`);
  }

  updateProgress(taskId: string, status: TaskStatus, result?: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (result) {
        task.result = result;
      }
      if (status === 'in-progress' && !task.startTime) {
        task.startTime = Date.now();
      } else if (['completed', 'failed', 'cancelled'].includes(status) && !task.endTime) {
        task.endTime = Date.now();
      }
      this.tasks.set(taskId, task);
      console.log(`Updated task ${taskId} status to: ${status}`);
    } else {
      console.warn(`Attempted to update progress for untracked task: ${taskId}`);
    }
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getOverallProgress(): ProgressReport {
    const totalTasks = this.tasks.size;
    if (totalTasks === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        failedTasks: 0,
        overallStatus: 'pending',
        completionPercentage: 0,
      };
    }

    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;
    let failedTasks = 0;

    this.tasks.forEach(task => {
      switch (task.status) {
        case 'completed':
          completedTasks++;
          break;
        case 'in-progress':
          inProgressTasks++;
          break;
        case 'pending':
          pendingTasks++;
          break;
        case 'failed':
          failedTasks++;
          break;
        case 'cancelled':
          failedTasks++; // Consider cancelled as failed for overall progress
          break;
      }
    });

    const completionPercentage = (completedTasks / totalTasks) * 100;
    let overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed' = 'pending';

    if (completedTasks === totalTasks) {
      overallStatus = 'completed';
    } else if (failedTasks > 0) {
      overallStatus = 'failed';
    } else if (inProgressTasks > 0 || completedTasks > 0) {
      overallStatus = 'in-progress';
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      failedTasks,
      overallStatus,
      completionPercentage,
    };
  }

  generateReport(): string {
    const report = this.getOverallProgress();
    let reportString = `--- Project Progress Report ---\n`;
    reportString += `Overall Status: ${report.overallStatus.toUpperCase()}\n`;
    reportString += `Completion: ${report.completionPercentage.toFixed(2)}%\n`;
    reportString += `Total Tasks: ${report.totalTasks}\n`;
    reportString += `Completed: ${report.completedTasks}\n`;
    reportString += `In Progress: ${report.inProgressTasks}\n`;
    reportString += `Pending: ${report.pendingTasks}\n`;
    reportString += `Failed/Cancelled: ${report.failedTasks}\n\n`;

    reportString += `--- Task Details ---\n`;
    this.tasks.forEach(task => {
      reportString += `Task ID: ${task.id}\n`;
      reportString += `  Description: ${task.description}\n`;
      reportString += `  Agent Type: ${task.agentType}\n`;
      reportString += `  Status: ${task.status.toUpperCase()}\n`;
      if (task.startTime) {
        reportString += `  Started: ${new Date(task.startTime).toLocaleString()}\n`;
      }
      if (task.endTime) {
        reportString += `  Ended: ${new Date(task.endTime).toLocaleString()}\n`;
      }
      if (task.result) {
        reportString += `  Result: ${JSON.stringify(task.result).substring(0, 100)}...\n`;
      }
      reportString += `\n`;
    });

    return reportString;
  }
}
