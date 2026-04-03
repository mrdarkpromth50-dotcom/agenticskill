import { BossCommand, Task, ExecutionPlan, Proposal, DailyReport, ProgressReport, CEOStatus, TrendItem } from './types';
import { CommunicationService } from './communication';
import { TaskPlanner } from './task-planner';
import { ProgressTracker } from './progress-tracker';
import { TrendResearchEngine } from './trend-research';
import { DailyReportGenerator } from './daily-report';
import { ProactiveScheduler } from './proactive-scheduler';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// Persistent Storage: MemoryClient (Redis + ChromaDB)
// ============================================================
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';
const AGENT_ID = 'ceo-agent';

interface MemoryHttpClient {
  post: (url: string, data: any) => Promise<any>;
  get: (url: string) => Promise<any>;
}

function createMemoryHttp(): MemoryHttpClient {
  const apiKey = (process.env.API_KEYS || '').split(',')[0] || '';
  return axios.create({
    baseURL: MEMORY_SYSTEM_URL,
    timeout: 8000,
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  }) as any;
}

// ============================================================
// Constants
// ============================================================
const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';
const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';

// Redis TTL constants (seconds)
const TTL_ACTIVE_PLAN = 86400;       // 24 hours
const TTL_CEO_STATUS = 300;          // 5 minutes
const TTL_LATEST_TRENDS = 21600;     // 6 hours

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
  private memoryHttp: MemoryHttpClient;

  constructor() {
    this.communication = new CommunicationService();
    this.taskPlanner = new TaskPlanner();
    this.progressTracker = new ProgressTracker();
    this.memoryHttp = createMemoryHttp();

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

  // ============================================================
  // Persistent Storage Helpers
  // ============================================================

  /** Store CEO status to Redis (short-term, 5 min TTL) */
  private async persistStatus(): Promise<void> {
    try {
      const statusData = JSON.stringify({
        status: this.status,
        activePlans: this.activePlans.size,
        lastCommand: this.lastCommand,
        updatedAt: new Date().toISOString(),
      });
      await this.memoryHttp.post('/memory/short-term', {
        agentId: AGENT_ID,
        key: 'current_status',
        value: statusData,
        ttl: TTL_CEO_STATUS,
      });
    } catch (err: any) {
      console.warn(`[CEOAgent] Failed to persist status to Redis: ${err.message}`);
    }
  }

  /** Store active execution plan to Redis (24h TTL) */
  private async persistActivePlan(plan: ExecutionPlan): Promise<void> {
    try {
      await this.memoryHttp.post('/memory/short-term', {
        agentId: AGENT_ID,
        key: `plan:${plan.id}`,
        value: JSON.stringify(plan),
        ttl: TTL_ACTIVE_PLAN,
      });
      console.log(`[CEOAgent] Persisted plan ${plan.id} to Redis`);
    } catch (err: any) {
      console.warn(`[CEOAgent] Failed to persist plan to Redis: ${err.message}`);
    }
  }

  /** Remove completed plan from Redis */
  private async removePlanFromRedis(planId: string): Promise<void> {
    try {
      // Short-term memory doesn't have explicit delete via HTTP in current API,
      // so we overwrite with empty value and 1s TTL
      await this.memoryHttp.post('/memory/short-term', {
        agentId: AGENT_ID,
        key: `plan:${planId}`,
        value: '{}',
        ttl: 1,
      });
    } catch (err: any) {
      console.warn(`[CEOAgent] Failed to remove plan from Redis: ${err.message}`);
    }
  }

  /** Store completed plan to ChromaDB (long-term memory) */
  private async archivePlanToChromaDB(plan: ExecutionPlan): Promise<void> {
    try {
      const document = `Execution Plan: ${plan.overallGoal}\n` +
        `Command: ${plan.bossCommand}\n` +
        `Status: ${plan.status}\n` +
        `Tasks: ${plan.tasks.map(t => `${t.description}(${t.status})`).join(', ')}\n` +
        `Created: ${new Date(plan.createdAt || 0).toISOString()}\n` +
        `Completed: ${plan.completedAt ? new Date(plan.completedAt).toISOString() : 'N/A'}`;

      // Simple hash-based embedding for ChromaDB
      const embedding = this.generateSimpleEmbedding(document);

      await this.memoryHttp.post('/memory/long-term', {
        agentId: AGENT_ID,
        document,
        embedding,
        metadata: {
          type: 'execution_plan',
          planId: plan.id,
          status: plan.status,
          bossCommand: plan.bossCommand,
          taskCount: plan.tasks.length,
          createdAt: new Date(plan.createdAt || 0).toISOString(),
          completedAt: plan.completedAt ? new Date(plan.completedAt).toISOString() : null,
        },
      });
      console.log(`[CEOAgent] Archived plan ${plan.id} to ChromaDB`);
    } catch (err: any) {
      console.warn(`[CEOAgent] Failed to archive plan to ChromaDB: ${err.message}`);
    }
  }

  /** Store latest trends to Redis (6h TTL) */
  private async persistTrends(trends: TrendItem[]): Promise<void> {
    try {
      await this.memoryHttp.post('/memory/short-term', {
        agentId: AGENT_ID,
        key: 'latest_trends',
        value: JSON.stringify(trends),
        ttl: TTL_LATEST_TRENDS,
      });
      console.log(`[CEOAgent] Persisted ${trends.length} trends to Redis`);
    } catch (err: any) {
      console.warn(`[CEOAgent] Failed to persist trends to Redis: ${err.message}`);
    }
  }

  /** Store daily report to ChromaDB (long-term memory) */
  private async archiveDailyReport(report: DailyReport): Promise<void> {
    try {
      const document = `Daily Report: ${report.title}\n` +
        `Date: ${report.date}\n` +
        `Summary: ${report.summary}\n` +
        `Agent Activities: ${report.agentActivitiesSummary}\n` +
        `Task Status: ${report.taskStatusSummary}\n` +
        `Financial Alerts: ${report.financialAlerts}\n` +
        `Key Achievements: ${report.keyAchievements}`;

      const embedding = this.generateSimpleEmbedding(document);

      await this.memoryHttp.post('/memory/long-term', {
        agentId: AGENT_ID,
        document,
        embedding,
        metadata: {
          type: 'daily_report',
          date: report.date,
          title: report.title,
        },
      });
      console.log(`[CEOAgent] Archived daily report to ChromaDB`);
    } catch (err: any) {
      console.warn(`[CEOAgent] Failed to archive daily report to ChromaDB: ${err.message}`);
    }
  }

  /** Publish CEO activity to shared memory channel */
  private async publishActivity(activity: string): Promise<void> {
    try {
      await this.memoryHttp.post('/memory/shared/publish', {
        channel: 'ceo-activities',
        message: JSON.stringify({
          agentId: AGENT_ID,
          activity,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err: any) {
      // Non-fatal
    }
  }

  /** Simple hash-based embedding (128 dimensions) */
  private generateSimpleEmbedding(text: string): number[] {
    const dim = 128;
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      const idx = (i * 7 + c * 13) % dim;
      vec[idx] = (vec[idx] + c / 255) % 1;
    }
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / mag);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  async start(): Promise<void> {
    console.log("CEO Agent: Starting logic and listening for commands...");
    this.communication.listenForCommands((command) => this.receiveCommand(command));

    // Restore status from Redis if available
    try {
      const savedStatus = await this.memoryHttp.get(`/memory/short-term/${AGENT_ID}/current_status`);
      if (savedStatus?.data?.value) {
        const parsed = JSON.parse(savedStatus.data.value);
        console.log(`[CEOAgent] Restored status from Redis: ${parsed.status} (updated: ${parsed.updatedAt})`);
      }
    } catch {
      console.log('[CEOAgent] No previous status found in Redis, starting fresh');
    }

    // Publish startup activity
    await this.publishActivity('CEO Agent started');
    await this.persistStatus();

    // Start proactive loops
    const trendResearchInterval = parseInt(process.env.TREND_RESEARCH_INTERVAL || '21600000'); // Default 6 hours
    this.proactiveScheduler.startTrendResearchLoop(trendResearchInterval);

    const dailyReportCron = process.env.DAILY_REPORT_CRON || '0 18 * * *'; // Default 6 PM daily
    this.proactiveScheduler.startDailyReportLoop(dailyReportCron);

    const idleCheckInterval = parseInt(process.env.IDLE_CHECK_INTERVAL || '1800000'); // Default 30 minutes
    this.proactiveScheduler.startIdleCheckLoop(idleCheckInterval, this.handleTrendProposal.bind(this));
  }

  // ============================================================
  // Command Processing
  // ============================================================

  async receiveCommand(command: BossCommand): Promise<void> {
    console.log(`CEO Agent: Received command from ${command.sender} via ${command.source}: ${command.text}`);
    this.lastCommand = command.text;
    this.status = 'busy';
    await this.persistStatus();
    await this.publishActivity(`Received command: ${command.text.substring(0, 100)}`);

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

      // Persist plan to Redis
      await this.persistActivePlan(executionPlan);

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
      await this.persistStatus();
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

      // Archive completed plan to ChromaDB (long-term memory)
      await this.archivePlanToChromaDB(plan);
      // Remove from Redis
      await this.removePlanFromRedis(planId);
      
      this.activePlans.delete(planId);
      if (this.activePlans.size === 0) {
        this.status = 'idle';
        await this.persistStatus();
      }
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

  // ============================================================
  // Proactive Features
  // ============================================================

  public async handleTrendProposal(proposal: Proposal): Promise<void> {
    console.log(`CEO Agent: Boss approved proposal: ${proposal.title}. Creating tasks...`);
    await this.communication.reportToBoss(`บอสครับ! ได้รับการอนุมัติข้อเสนอ: ${proposal.title} แล้วครับ กำลังดำเนินการสร้างงาน...`);
    await this.publishActivity(`Approved proposal: ${proposal.title}`);

    const taskDescription = `Implement key action items from proposal: ${proposal.title}. Summary: ${proposal.summary}. Action items: ${proposal.actionItems.join(', ')}`;
    const command: BossCommand = { text: taskDescription, sender: 'CEO_PROACTIVE', source: 'api' };
    await this.receiveCommand(command);
  }

  public async triggerTrendResearch(): Promise<TrendItem[]> {
    this.latestTrends = await this.trendResearchEngine.searchTrends();
    // Persist trends to Redis for fast retrieval
    await this.persistTrends(this.latestTrends);
    await this.publishActivity(`Trend research completed: ${this.latestTrends.length} trends found`);
    return this.latestTrends;
  }

  public getLatestTrends(): TrendItem[] {
    return this.latestTrends;
  }

  public async triggerDailyReport(): Promise<DailyReport> {
    this.latestDailyReport = await this.dailyReportGenerator.generateReport();
    // Archive daily report to ChromaDB (long-term memory)
    await this.archiveDailyReport(this.latestDailyReport);
    await this.publishActivity('Daily report generated and archived');
    return this.latestDailyReport;
  }

  public getLatestReport(): DailyReport | undefined {
    return this.latestDailyReport;
  }

  async getStoredProposals(): Promise<Proposal[]> {
    return this.trendResearchEngine.getStoredProposals();
  }

  // ============================================================
  // Status & Reporting
  // ============================================================

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
