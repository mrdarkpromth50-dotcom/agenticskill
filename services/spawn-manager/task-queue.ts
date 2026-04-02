import { Task } from './types';

export class TaskQueue {
  private queue: Task[] = [];

  addTask(task: Task): void {
    this.queue.push(task);
    console.log(`TaskQueue: Added task ${task.id}. Current queue size: ${this.queue.length}`);
  }

  getNextTask(): Task | undefined {
    if (this.queue.length > 0) {
      const task = this.queue.shift();
      console.log(`TaskQueue: Retrieved task ${task?.id}. Current queue size: ${this.queue.length}`);
      return task;
    }
    return undefined;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  peekNextTask(): Task | undefined {
    return this.queue.length > 0 ? this.queue[0] : undefined;
  }
}
