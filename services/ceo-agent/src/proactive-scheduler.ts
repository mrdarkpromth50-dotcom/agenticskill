import { TrendResearchEngine } from './trend-research';
import { DailyReportGenerator } from './daily-report';
import { Proposal, DailyReport } from './types';
import axios from 'axios';
import cron from 'node-cron';

const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';

export class ProactiveScheduler {
  private trendResearchEngine: TrendResearchEngine;
  private dailyReportGenerator: DailyReportGenerator;
  private llmCall: (prompt: string, model?: string) => Promise<string>;
  private trendResearchLoopInterval: NodeJS.Timeout | null = null;
  private dailyReportCronJob: cron.ScheduledTask | null = null;
  private idleCheckLoopInterval: NodeJS.Timeout | null = null;

  constructor(
    trendResearchEngine: TrendResearchEngine,
    dailyReportGenerator: DailyReportGenerator,
    llmCall: (prompt: string, model?: string) => Promise<string>
  ) {
    this.trendResearchEngine = trendResearchEngine;
    this.dailyReportGenerator = dailyReportGenerator;
    this.llmCall = llmCall;
  }

  public startTrendResearchLoop(intervalMs: number): void {
    console.log(`[ProactiveScheduler] Starting trend research loop every ${intervalMs / 3600000} hours.`);
    this.trendResearchLoopInterval = setInterval(async () => {
      try {
        const trends = await this.trendResearchEngine.searchTrends();
        for (const trend of trends) {
          const analysis = await this.trendResearchEngine.analyzeTrend(trend);
          if (analysis.relevance > 70) {
            const proposal = await this.trendResearchEngine.createProposal(trend, analysis);
            await this.trendResearchEngine.saveToMemory(proposal);
            console.log(`[ProactiveScheduler] New relevant trend proposal saved: ${proposal.title}`);
          }
        }
      } catch (error) {
        console.error('[ProactiveScheduler] Error in trend research loop:', error);
      }
    }, intervalMs);
  }

  public startDailyReportLoop(cronTime: string): void {
    console.log(`[ProactiveScheduler] Starting daily report cron job at ${cronTime}.`);
    this.dailyReportCronJob = cron.schedule(cronTime, async () => {
      try {
        const report = await this.dailyReportGenerator.generateReport();
        // Assuming CEO Agent will decide where to send the report
        // For now, just log it or store it.
        console.log('[ProactiveScheduler] Daily report generated:', report.title);
        // Optionally save to memory or send via a default channel
      } catch (error) {
        console.error('[ProactiveScheduler] Error in daily report cron job:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Bangkok' // Adjust timezone as needed
    });
  }

  public startIdleCheckLoop(intervalMs: number, proposeCallback: (proposal: Proposal) => Promise<void>): void {
    console.log(`[ProactiveScheduler] Starting idle check loop every ${intervalMs / 60000} minutes.`);
    this.idleCheckLoopInterval = setInterval(async () => {
      try {
        const pendingTasksResponse = await axios.get(`${SPAWN_MANAGER_URL}/tasks?status=pending`);
        const pendingTasks = pendingTasksResponse.data.tasks;

        if (pendingTasks.length === 0) {
          console.log('[ProactiveScheduler] Task queue is idle. Checking for proposals...');
          const storedProposals = await this.trendResearchEngine.getStoredProposals();
          if (storedProposals.length > 0) {
            // Simple strategy: pick the first available proposal
            const bestProposal = storedProposals[0]; 
            console.log(`[ProactiveScheduler] Proposing new task: ${bestProposal.title}`);
            await proposeCallback(bestProposal);
            // In a real scenario, mark proposal as 'proposed' or remove from 'pending' state
          } else {
            console.log('[ProactiveScheduler] No new proposals to suggest.');
          }
        } else {
          console.log(`[ProactiveScheduler] ${pendingTasks.length} pending tasks found. Not proposing new tasks.`);
        }
      } catch (error) {
        console.error('[ProactiveScheduler] Error in idle check loop:', error);
      }
    }, intervalMs);
  }

  public stopAll(): void {
    console.log('[ProactiveScheduler] Stopping all proactive loops.');
    if (this.trendResearchLoopInterval) {
      clearInterval(this.trendResearchLoopInterval);
      this.trendResearchLoopInterval = null;
    }
    if (this.dailyReportCronJob) {
      this.dailyReportCronJob.stop();
      this.dailyReportCronJob = null;
    }
    if (this.idleCheckLoopInterval) {
      clearInterval(this.idleCheckLoopInterval);
      this.idleCheckLoopInterval = null;
    }
  }
}
