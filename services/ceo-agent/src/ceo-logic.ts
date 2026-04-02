import { BossCommand, Task, ExecutionPlan, Proposal, DailyReport, ProgressReport, CEOStatus, TrendItem } from './types';
import { CommunicationService } from './communication';
import { TaskPlanner } from './task-planner';
import { ProgressTracker } from './progress-tracker';
import { TrendResearchEngine } from './trend-research';
import { DailyReportGenerator } from './daily-report';
import { ProactiveScheduler } from './proactive-scheduler';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';
const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';

export class CEOAgent {
  private communication: CommunicationService;
  private taskPlanner: TaskPlanner;
  private progressTracker: ProgressTracker;
  private trendResearchEngine: TrendResearchEngine;
  private dailyReportGenerator: DailyReportGenerator;
  private proactiveScheduler: ProactiveScheduler;
  private activePlans: Map<string, ExecutionPlan> = new Map();
  private status: 'idle' | 'busy' | 'error' = 'idle';
  private lastCommand?: string;
  private latestTrends: TrendItem[] = [];
  private latestDailyReport?: DailyReport;

  constructor() {
    this.communication = new CommunicationService();
    this.taskPlanner = new TaskPlanner();
    this.progressTracker = new ProgressTracker();

    // LLM call function for TrendResearchEngine and DailyReportGenerator
    const llmCall = async (prompt: string, model?: string): Promise<string> => {
      try {
        const response = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
          prompt,
          model: model || 'default',
        });
        return response.data.text;
      } catch (error) {
        console.error('Error calling LLM via Antigravity Proxy:', error);
        throw error;
      }
    };

    this.trendResearchEngine = new TrendResearchEngine(llmCall);
    this.dailyReportGenerator = new DailyReportGenerator(llmCall);
    this.proactiveScheduler = new ProactiveScheduler(
      this.trendResearchEngine,
      this.dailyReportGenerator,
      llmCall
    );
  }

  async start(): Promise<void> {
    console.log("CEO Agent: Starting logic and listening for commands...");
    this.communication.listenForCommands((command) => this.receiveCommand(command));
    
    // Start proactive loops
    const trendResearchInterval = parseInt(process.env.TREND_RESEARCH_INTERVAL || '21600000'); // Default 6 hours
    this.proactiveScheduler.startTrendResearchLoop(trendResearchInterval);

    const dailyReportCron = process.env.DAILY_REPORT_CRON || '0 18 * * *'; // Default 6 PM daily
    this.proactiveScheduler.startDailyReportLoop(dailyReportCron);

    const idleCheckInterval = parseInt(process.env.IDLE_CHECK_INTERVAL || '1800000'); // Default 30 minutes
    this.proactiveScheduler.startIdleCheckLoop(idleCheckInterval, this.handleTrendProposal.bind(this));
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

      executionPlan.id = uuidv4();
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
      
      executionPlan.tasks.forEach(task => this.progressTracker.trackTask(task));

      await this.delegateTasksSequentially(executionPlan.id);

    } catch (error) {
      console.error("CEO Agent: Error processing command:", error);
      this.status = 'error';
      await this.communication.reportToBoss(`ขออภัยครับบอส เกิดข้อผิดพลาดในการประมวลผลคำสั่ง: ${error instanceof Error ? (error as any).message : String(error)}`);
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
      
      this.trackSpawnedTaskProgress(planId, task.id);
    } catch (error) {
      console.error(`CEO Agent: Failed to delegate task ${task.id}:`, error);
      this.progressTracker.updateProgress(task.id, 'failed', { error: 'Failed to connect to Spawn Manager' });
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
          await this.delegateTasksSequentially(planId);
        } else if (taskData.status === 'failed' || taskData.status === 'cancelled') {
          clearInterval(checkInterval);
          this.progressTracker.updateProgress(taskId, taskData.status, taskData.error);
          console.error(`CEO Agent: Task ${taskId} ${taskData.status}.`);
          await this.checkPlanCompletion(planId);
        }
      } catch (error) {
        console.error(`CEO Agent: Error tracking spawned task ${taskId}:`, error);
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

  // New methods for proactive features
  public async handleTrendProposal(proposal: Proposal): Promise<void> {
    console.log(`CEO Agent: Boss approved proposal: ${proposal.title}. Creating tasks...`);
    // Here, the CEO Agent would convert the proposal's actionItems into actual tasks
    // and then delegate them via receiveCommand or directly to delegateTask.
    // For simplicity, let's just log for now.
    await this.communication.reportToBoss(`บอสครับ! ได้รับการอนุมัติข้อเสนอ: ${proposal.title} แล้วครับ กำลังดำเนินการสร้างงาน...`);
    // Example: Create a simple task from the proposal
    const taskDescription = `Implement key action items from proposal: ${proposal.title}. Summary: ${proposal.summary}. Action items: ${proposal.actionItems.join(', ')}`;
    const command: BossCommand = { text: taskDescription, sender: 'CEO_PROACTIVE', source: 'api' };
    await this.receiveCommand(command); // Re-use existing command processing logic
  }

  public async triggerTrendResearch(): Promise<TrendItem[]> {
    this.latestTrends = await this.trendResearchEngine.searchTrends();
    return this.latestTrends;
  }

  public getLatestTrends(): TrendItem[] {
    return this.latestTrends;
  }

  public async triggerDailyReport(): Promise<DailyReport> {
    this.latestDailyReport = await this.dailyReportGenerator.generateReport();
    return this.latestDailyReport;
  }

  public getLatestReport(): DailyReport | undefined {
    return this.latestDailyReport;
  }

  async getStoredProposals(): Promise<Proposal[]> {
    return this.trendResearchEngine.getStoredProposals();
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
