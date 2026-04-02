import { BossCommand, TaskPlan, SubTask, CEOStatus, Task, ExecutionPlan } from './types';
import { CommunicationService } from './communication';
import { TaskPlanner } from './task-planner';
import { ProgressTracker } from './progress-tracker';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';

export class CEOAgent {
  private communication: CommunicationService;
  private taskPlanner: TaskPlanner;
  private progressTracker: ProgressTracker;
  private activePlans: Map<string, ExecutionPlan> = new Map(); // Changed to ExecutionPlan
  private status: 'idle' | 'busy' | 'error' = 'idle';
  private lastCommand?: string;

  constructor() {
    this.communication = new CommunicationService();
    this.taskPlanner = new TaskPlanner();
    this.progressTracker = new ProgressTracker();
  }

  async start(): Promise<void> {
    console.log("CEO Agent: Starting logic and listening for commands...");
    this.communication.listenForCommands((command) => this.receiveCommand(command));
    
    // Start proactive research interval
    setInterval(() => this.proactiveResearch(), 3600000); // Every hour
  }

  async receiveCommand(command: BossCommand): Promise<void> {
    console.log(`CEO Agent: Received command from ${command.sender} via ${command.source}: ${command.text}`);
    this.lastCommand = command.text;
    this.status = 'busy';

    try {
      const analysis = await this.taskPlanner.analyzeCommand(command);
      if (analysis.error) {
        throw new Error(`Task analysis failed: ${analysis.error}`);
      }
      const executionPlan = this.taskPlanner.createExecutionPlan(analysis);
      const { totalTime, totalCost } = this.taskPlanner.estimateResources(executionPlan);

      executionPlan.id = uuidv4(); // Assign a unique ID to the execution plan
      executionPlan.bossCommand = command.text;
      executionPlan.overallGoal = `Process command: ${command.text}`;
      executionPlan.status = 'planning';
      executionPlan.createdAt = Date.now();
      this.activePlans.set(executionPlan.id, executionPlan);

      await this.communication.reportToBoss(
        `รับทราบครับบอส! ผมได้วางแผนงานสำหรับ "${executionPlan.overallGoal}" เรียบร้อยแล้ว โดยแบ่งเป็น ${executionPlan.tasks.length} งานย่อย\n` +
        `ประมาณการเวลา: ${totalTime} ชั่วโมง, ประมาณการค่าใช้จ่าย: $${totalCost}\n` +
        `กำลังเริ่มดำเนินการครับ...`
      );
      
      // Track all tasks in the progress tracker
      executionPlan.tasks.forEach(task => this.progressTracker.trackTask(task));

      // Delegate tasks based on dependencies
      await this.delegateTasksSequentially(executionPlan.id);

    } catch (error) {
      console.error("CEO Agent: Error processing command:", error);
      this.status = 'error';
      await this.communication.reportToBoss(`ขออภัยครับบอส เกิดข้อผิดพลาดในการประมวลผลคำสั่ง: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async delegateTasksSequentially(planId: string): Promise<void> {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    const executableTasks = plan.tasks.filter(task => 
      task.status === 'pending' && 
      task.dependencies.every(depId => 
        this.progressTracker.getTask(depId)?.status === 'completed'
      )
    );

    for (const task of executableTasks) {
      this.progressTracker.updateProgress(task.id, 'in-progress');
      await this.delegateTask(planId, task);
    }

    // Check if all tasks are finished after delegation
    await this.checkPlanCompletion(planId);
  }

  private async delegateTask(planId: string, task: Task): Promise<void> {
    console.log(`CEO Agent: Delegating task ${task.id} (${task.description}) to Spawn Manager...`);
    try {
      const response = await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: task.agentType,
        description: task.description,
        payload: { planId, taskId: task.id }
      });

      task.spawnTaskId = response.data.id;
      this.progressTracker.updateProgress(task.id, 'in-progress');
      
      // Start tracking progress for this specific task
      this.trackSpawnedTaskProgress(planId, task.id);
    } catch (error) {
      console.error(`CEO Agent: Failed to delegate task ${task.id}:`, error);
      this.progressTracker.updateProgress(task.id, 'failed', { error: 'Failed to connect to Spawn Manager' });
      // Attempt to continue with other tasks or report failure
      await this.checkPlanCompletion(planId);
    }
  }

  private async trackSpawnedTaskProgress(planId: string, taskId: string): Promise<void> {
    const task = this.progressTracker.getTask(taskId);
    if (!task || !task.spawnTaskId) return;

    const checkInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${SPAWN_MANAGER_URL}/tasks/${task.spawnTaskId}`);
        const taskData = response.data;

        if (taskData.status === 'completed') {
          clearInterval(checkInterval);
          this.progressTracker.updateProgress(taskId, 'completed', taskData.result);
          console.log(`CEO Agent: Task ${taskId} completed.`);
          await this.delegateTasksSequentially(planId); // Try to delegate next tasks
        } else if (taskData.status === 'failed' || taskData.status === 'cancelled') {
          clearInterval(checkInterval);
          this.progressTracker.updateProgress(taskId, taskData.status, taskData.error);
          console.error(`CEO Agent: Task ${taskId} ${taskData.status}.`);
          await this.checkPlanCompletion(planId); // Check plan completion on failure
        }
      } catch (error) {
        console.error(`CEO Agent: Error tracking spawned task ${taskId}:`, error);
        // If tracking fails, mark task as failed to prevent infinite loop
        clearInterval(checkInterval);
        this.progressTracker.updateProgress(taskId, 'failed', { error: 'Failed to track progress from Spawn Manager' });
        await this.checkPlanCompletion(planId);
      }
    }, 10000); // Check every 10 seconds
  }

  private async checkPlanCompletion(planId: string): Promise<void> {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    const overallProgress = this.progressTracker.getOverallProgress();

    if (overallProgress.overallStatus === 'completed' || overallProgress.overallStatus === 'failed') {
      plan.status = overallProgress.overallStatus;
      plan.completedAt = Date.now();
      
      const report = this.consolidateResults(plan.id);
      await this.communication.reportToBoss(report);
      
      this.activePlans.delete(planId);
      if (this.activePlans.size === 0) this.status = 'idle';
    }
  }

  private consolidateResults(planId: string): string {
    const plan = this.activePlans.get(planId);
    if (!plan) return "รายงานไม่พบแผนงานนี้";

    const tasks = this.progressTracker.getAllTasks();
    let report = `บอสครับ! งานสำหรับ "${plan.bossCommand}" เสร็จสิ้นแล้วครับ\n\n`;
    tasks.forEach((t, i) => {
      report += `${i + 1}. ${t.description}: ${t.status === 'completed' ? '✅ สำเร็จ' : '❌ ล้มเหลว (' + (t.result?.error || 'ไม่ทราบสาเหตุ') + ')'}\n`;
    });
    report += `\nสถานะโดยรวม: ${plan.status === 'completed' ? '✅ สำเร็จ' : '❌ ล้มเหลว'}\n`;
    report += `\n${this.progressTracker.generateReport()}`;
    return report;
  }

  async proactiveResearch(): Promise<void> {
    console.log("CEO Agent: Performing proactive research on trends...");
    // Placeholder for actual research logic
  }

  getStatus(): CEOStatus {
    return {
      status: this.status,
      activePlans: this.activePlans.size,
      lastCommand: this.lastCommand,
      overallProgress: this.progressTracker.getOverallProgress()
    };
  }

  getActivePlans(): ExecutionPlan[] {
    return Array.from(this.activePlans.values());
  }

  async triggerReport(): Promise<void> {
    const status = this.getStatus();
    let report = `รายงานสถานะ CEO Agent:\n- สถานะ: ${status.status}\n- งานที่กำลังดำเนินการ: ${status.activePlans}\n- คำสั่งล่าสุด: ${status.lastCommand || 'ไม่มี'}\n\n`;
    report += this.progressTracker.generateReport();
    await this.communication.reportToBoss(report);
  }
}
