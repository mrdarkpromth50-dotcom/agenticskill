import { Task, TaskStatus } from "./types";
import { v4 as uuidv4 } from "uuid";

export class TaskQueue {
  // Using a Map for efficient task retrieval and updates by ID.
  private tasks: Map<string, Task> = new Map();

  constructor() {
    console.log("TaskQueue initialized.");
  }

  /**
   * Adds a new task to the queue with a 'pending' status.
   */
  enqueue(agentType: string, description: string, payload: any): Task {
    const newTask: Task = {
      id: uuidv4(),
      agentType,
      description,
      payload,
      status: "pending",
      createdAt: Date.now(),
    };
    this.tasks.set(newTask.id, newTask);
    console.log(`Task enqueued: ${newTask.id} (Agent: ${agentType}). Total tasks: ${this.tasks.size}.`);
    return newTask;
  }

  /**
   * Retrieves and removes the next pending task from the queue (FIFO).
   */
  dequeue(): Task | undefined {
    let oldestPendingTask: Task | undefined;

    // Iterate to find the oldest task with 'pending' status.
    for (const task of this.tasks.values()) {
      if (task.status === "pending") {
        if (!oldestPendingTask || task.createdAt < oldestPendingTask.createdAt) {
          oldestPendingTask = task;
        }
      }
    }

    if (oldestPendingTask) {
      // This is not a real dequeue, as the task remains in the map.
      // The status is updated by the SpawnManager when it picks up the task.
      // This method just finds the next task to be processed.
      return oldestPendingTask;
    }

    return undefined; // No pending tasks
  }

  /**
   * Returns the next pending task without removing it from the queue.
   */
  peek(): Task | undefined {
    return this.dequeue(); // Same logic as dequeue for finding the next task
  }

  /**
   * Returns the total number of tasks, regardless of status.
   */
  size(): number {
    return this.tasks.size;
  }

  /**
   * Retrieves a specific task by its ID.
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Retrieves all tasks.
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Filters tasks by a specific status.
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * Updates the status and other properties of a task.
   */
  updateTask(taskId: string, updates: Partial<Omit<Task, "id">>): Task | undefined {
    const task = this.tasks.get(taskId);
    if (task) {
      const updatedTask = { ...task, ...updates };

      // Automatically set timestamps based on status changes
      if (updates.status === "in-progress" && !task.startedAt) {
        updatedTask.startedAt = Date.now();
      } else if (["completed", "failed", "cancelled"].includes(updates.status as string) && !task.completedAt) {
        updatedTask.completedAt = Date.now();
      }

      this.tasks.set(taskId, updatedTask);
      console.log(`Task ${taskId} updated. New status: ${updatedTask.status}`);
      return updatedTask;
    }
    console.warn(`Attempted to update non-existent task: ${taskId}`);
    return undefined;
  }

  /**
   * Deletes a task from the queue. Typically used for cleanup.
   */
  deleteTask(taskId: string): boolean {
    const wasDeleted = this.tasks.delete(taskId);
    if (wasDeleted) {
      console.log(`Task ${taskId} deleted from the queue.`);
    } else {
      console.warn(`Attempted to delete non-existent task: ${taskId}`);
    }
    return wasDeleted;
  }
}
