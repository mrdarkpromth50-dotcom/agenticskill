import axios from 'axios';
import { DailyReport } from './types';

const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';
const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';
const DISCORD_REPORT_WEBHOOK_URL = process.env.DISCORD_REPORT_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_REPORT_CHAT_ID = process.env.TELEGRAM_REPORT_CHAT_ID;

export class DailyReportGenerator {
  private llmCall: (prompt: string, model?: string) => Promise<string>;

  constructor(llmCall: (prompt: string, model?: string) => Promise<string>) {
    this.llmCall = llmCall;
  }

  public async collectAgentActivities(): Promise<any[]> {
    console.log('[DailyReportGenerator] Collecting agent activities from Memory System...');
    try {
      // Placeholder for shared memory activities. Assuming a specific endpoint for activities.
      const response = await axios.get(`${MEMORY_SYSTEM_URL}/memory/shared/activities`);
      console.log(`[DailyReportGenerator] Collected ${response.data.activities.length} activities.`);
      return response.data.activities;
    } catch (error) {
      console.error('[DailyReportGenerator] Error collecting agent activities:', error);
      return [];
    }
  }

  public async collectTaskStatus(): Promise<any[]> {
    console.log('[DailyReportGenerator] Collecting task statuses from Spawn Manager...');
    try {
      const response = await axios.get(`${SPAWN_MANAGER_URL}/tasks`);
      console.log(`[DailyReportGenerator] Collected ${response.data.tasks.length} tasks.`);
      return response.data.tasks;
    } catch (error) {
      console.error('[DailyReportGenerator] Error collecting task statuses:', error);
      return [];
    }
  }

  public async generateReport(): Promise<DailyReport> {
    console.log('[DailyReportGenerator] Generating daily report...');
    const activities = await this.collectAgentActivities();
    const tasks = await this.collectTaskStatus();

    // Placeholder for financial alerts and key achievements
    const financialAlerts = 'No critical financial alerts.';
    const keyAchievements = 'Successfully implemented new features in Agentic Skill project.';

    const prompt = `Generate a formal daily report in Thai for the CEO. Summarize the following agent activities, task statuses, financial alerts, and key achievements. The report should be concise, professional, and highlight important information. Format the output as a JSON object with 'title', 'date', 'summary', 'agentActivitiesSummary', 'taskStatusSummary', 'financialAlerts', 'keyAchievements' fields.

Agent Activities: ${JSON.stringify(activities)}
Task Statuses: ${JSON.stringify(tasks)}
Financial Alerts: ${financialAlerts}
Key Achievements: ${keyAchievements}`;

    try {
      const llmResponse = await this.llmCall(prompt);
      const report = JSON.parse(llmResponse) as DailyReport;
      report.date = new Date().toISOString();
      report.title = report.title || 'รายงานประจำวัน';
      console.log('[DailyReportGenerator] Daily report generated.');
      return report;
    } catch (error) {
      console.error('[DailyReportGenerator] Error generating report:', error);
      throw new Error(`Failed to generate daily report: ${(error as any).message}`);
    }
  }

  public async sendReport(report: DailyReport, channel: 'discord' | 'telegram'): Promise<void> {
    console.log(`[DailyReportGenerator] Sending daily report to ${channel}...`);
    const reportText = `**${report.title}**\nวันที่: ${new Date(report.date).toLocaleDateString('th-TH')}\n\n**สรุปภาพรวม:**\n${report.summary}\n\n**กิจกรรมของ Agent:**\n${report.agentActivitiesSummary}\n\n**สถานะ Task:**\n${report.taskStatusSummary}\n\n**การแจ้งเตือนทางการเงิน:**\n${report.financialAlerts}\n\n**ความสำเร็จที่สำคัญ:**\n${report.keyAchievements}`;

    try {
      if (channel === 'discord' && DISCORD_REPORT_WEBHOOK_URL) {
        await axios.post(DISCORD_REPORT_WEBHOOK_URL, { content: reportText });
        console.log('[DailyReportGenerator] Report sent to Discord.');
      } else if (channel === 'telegram' && TELEGRAM_BOT_TOKEN && TELEGRAM_REPORT_CHAT_ID) {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: TELEGRAM_REPORT_CHAT_ID,
          text: reportText,
          parse_mode: 'Markdown',
        });
        console.log('[DailyReportGenerator] Report sent to Telegram.');
      } else {
        console.warn(`[DailyReportGenerator] No valid webhook/token for ${channel}. Report not sent.`);
      }
    } catch (error) {
      console.error(`[DailyReportGenerator] Error sending report to ${channel}:`, error);
      throw new Error(`Failed to send report to ${channel}: ${(error as any).message}`);
    }
  }
}
