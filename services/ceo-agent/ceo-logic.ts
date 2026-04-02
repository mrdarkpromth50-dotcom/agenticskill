import { CEOAgentConfig, BossCommand, TaskPlan, AgentReport, TrendProposal } from './types';
import { DiscordCommunicator, TelegramCommunicator } from './communication';
// Assume these are available globally or via import from other services
// import { SpawnManagerClient } from '../../services/spawn-manager/client';
// import { MemoryManagerClient } from '../../services/memory-system/client';
// import { TranslationServiceClient } from '../../services/translation-layer/client';

export class CEOAgent {
  private currentTask: TaskPlan | null = null;
  private isBusy: boolean = false;

  constructor(
    private config: CEOAgentConfig,
    private discordComm: DiscordCommunicator,
    private telegramComm: TelegramCommunicator,
    // private spawnManager: SpawnManagerClient,
    // private memoryManager: MemoryManagerClient,
    // private translationService: TranslationServiceClient,
  ) {}

  async start(): Promise<void> {
    console.log(`CEO Agent ${this.config.name} (${this.config.id}) started.`);
    // Listen for commands from Boss (Telegram) and internal communications (Discord)
    this.telegramComm.onCommand(this.handleBossCommand.bind(this));
    this.discordComm.onInternalMessage(this.handleInternalMessage.bind(this));

    // Start proactive loops
    this.startProactiveTrendProposalLoop();
    this.startDailyReportLoop();
  }

  private async handleBossCommand(command: BossCommand): Promise<void> {
    console.log(`CEO Agent received command from Boss: ${command.text}`);

    if (this.isBusy) {
      await this.telegramComm.sendMessage(
        `บอสครับ ตอนนี้ผมกำลังดำเนินการงานอื่นอยู่ กรุณารอสักครู่ หรือหากเป็นงานด่วนมาก โปรดระบุคำว่า 'ด่วนที่สุด' ครับ`
      );
      return;
    }

    this.isBusy = true;
    try {
      // 1. วางแผน (Planning)
      const plan: TaskPlan = await this.planTask(command.text);
      this.currentTask = plan;
      await this.telegramComm.sendMessage(
        `บอสครับ ผมได้รับคำสั่ง \"${command.text}\" แล้วครับ กำลังดำเนินการวางแผนและมอบหมายงานให้ Agent ที่เกี่ยวข้องครับ`
      );
      await this.discordComm.sendInternalMessage(
        `CEO: ได้รับคำสั่งใหม่จากบอส: \"${command.text}\" กำลังวางแผนและมอบหมายงานครับ`
      );

      // 2. มอบหมาย Agent และทำงาน (Delegation & Execution)
      await this.executeTaskPlan(plan);

      // 3. สรุปและรายงานบอส (Reporting)
      await this.reportTaskCompletion(plan);

    } catch (error) {
      console.error("Error processing boss command:", error);
      await this.telegramComm.sendMessage(
        `บอสครับ เกิดข้อผิดพลาดในการดำเนินการงาน \"${command.text}\" ครับ ผมจะทำการวิเคราะห์และแก้ไขโดยเร็วที่สุดครับ`
      );
    } finally {
      this.isBusy = false;
      this.currentTask = null;
    }
  }

  private async planTask(commandText: string): Promise<TaskPlan> {
    console.log(`CEO Agent: Planning task for: ${commandText}`);
    // This is where the CEO uses its LLM capabilities and skills
    // to break down the command into sub-tasks, identify required agents, and define dependencies.
    // For now, it's a simulation.
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate planning time
    const taskPlan: TaskPlan = {
      id: `task-${Date.now()}`,
      bossCommand: commandText,
      overallGoal: `ดำเนินการตามคำสั่ง \"${commandText}\" ให้สำเร็จ 100% โดยอัตโนมัติ`,
      subTasks: [
        { id: "subtask-1", description: "วิเคราะห์คำสั่งและกำหนดขอบเขตงาน", assignedAgentType: "ceo", status: "completed" },
        { id: "subtask-2", description: "วางแผนการทำงานโดยละเอียด", assignedAgentType: "ceo", status: "completed" },
        { id: "subtask-3", description: "มอบหมายงานให้ Agent ที่เหมาะสม", assignedAgentType: "ceo", status: "pending" },
        { id: "subtask-4", description: "ติดตามและประสานงานการทำงานของ Agent", assignedAgentType: "ceo", status: "pending" },
        { id: "subtask-5", description: "รวบรวมผลลัพธ์และตรวจสอบคุณภาพ", assignedAgentType: "ceo", status: "pending" },
        { id: "subtask-6", description: "จัดทำรายงานสรุปและนำเสนอต่อบอส", assignedAgentType: "ceo", status: "pending" },
      ],
      status: "planning",
      createdAt: Date.now(),
    };
    console.log(`CEO Agent: Task plan created for ${commandText}`);
    return taskPlan;
  }

  private async executeTaskPlan(plan: TaskPlan): Promise<void> {
    console.log(`CEO Agent: Executing task plan for ${plan.id}`);
    for (const subTask of plan.subTasks) {
      if (subTask.status === "pending") {
        console.log(`CEO Agent: Delegating sub-task \"${subTask.description}\" to ${subTask.assignedAgentType}`);
        await this.discordComm.sendInternalMessage(
          `CEO: มอบหมายงานย่อย \"${subTask.description}\" ให้กับ ${subTask.assignedAgentType} Agent ครับ`
        );
        // Simulate delegation to Spawn Manager or direct execution for Persistent Agents
        // if (subTask.assignedAgentType === 'ceo') {
        //   // CEO executes its own sub-tasks
        //   await this.executeCEOSubTask(subTask);
        // } else {
        //   await this.spawnManager.submitTask({ id: subTask.id, agentType: subTask.assignedAgentType, description: subTask.description, payload: {} });
        // }
        await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate agent working time
        subTask.status = "completed";
        await this.discordComm.sendInternalMessage(
          `CEO: งานย่อย \"${subTask.description}\" โดย ${subTask.assignedAgentType} Agent เสร็จสิ้นแล้วครับ`
        );
      }
    }
    plan.status = "completed";
    console.log(`CEO Agent: Task plan ${plan.id} completed.`);
  }

  private async reportTaskCompletion(plan: TaskPlan): Promise<void> {
    const reportText = `บอสครับ งาน \"${plan.bossCommand}\" ได้ดำเนินการเสร็จสิ้นสมบูรณ์แล้วครับ ผลลัพธ์เป็นไปตามแผนที่วางไว้และได้รับการตรวจสอบคุณภาพเรียบร้อยแล้วครับ หากมีข้อสงสัยเพิ่มเติม โปรดแจ้งได้เลยครับ`;
    await this.telegramComm.sendMessage(reportText);
    await this.discordComm.sendInternalMessage(`CEO: รายงานบอสว่างาน \"${plan.bossCommand}\" เสร็จสิ้นแล้วครับ`);
    console.log(`CEO Agent: Reported task completion to Boss for task ${plan.id}.`);
  }

  private async handleInternalMessage(message: string): Promise<void> {
    console.log(`CEO Agent received internal message: ${message}`);
    // This is where CEO processes reports from other agents, handles issues, etc.
    // For example, if a Debugger Agent reports a bug fix, CEO might update the task status.
  }

  private startProactiveTrendProposalLoop(): void {
    const interval = 24 * 60 * 60 * 1000; // Every 24 hours
    setInterval(async () => {
      if (!this.isBusy) {
        console.log("CEO Agent: Proactively researching trends and opportunities...");
        // Simulate research using skills and tools
        await new Promise(resolve => setTimeout(resolve, 15000));
        const trend: TrendProposal = {
          title: "เทรนด์ AI Personalization ใน E-commerce",
          description: "การนำ AI มาใช้ในการปรับแต่งประสบการณ์การช้อปปิ้งส่วนบุคคล ซึ่งสามารถเพิ่มยอดขายและ Loyalty ของลูกค้าได้อย่างมีนัยสำคัญ",
          potentialImpact: "เพิ่ม Conversion Rate 15%, ลด Customer Churn 10%",
          recommendation: "ควรพิจารณาลงทุนในเทคโนโลยี AI Personalization สำหรับแพลตฟอร์ม E-commerce ของเรา"
        };
        await this.proposeTrendToBoss(trend);
      }
    }, interval);
  }

  private async proposeTrendToBoss(trend: TrendProposal): Promise<void> {
    const proposalText = `บอสครับ ผมได้ทำการวิเคราะห์เทรนด์ตลาดและพบโอกาสใหม่ที่น่าสนใจครับ\n\n**หัวข้อ:** ${trend.title}\n**รายละเอียด:** ${trend.description}\n**ผลกระทบที่อาจเกิดขึ้น:** ${trend.potentialImpact}\n**ข้อเสนอแนะ:** ${trend.recommendation}\n\nหากบอสสนใจ ผมสามารถจัดทำแผนการศึกษาและนำเสนอรายละเอียดเพิ่มเติมได้ครับ`;
    await this.telegramComm.sendMessage(proposalText);
    await this.discordComm.sendInternalMessage(`CEO: เสนอเทรนด์ใหม่ \"${trend.title}\" ให้บอสพิจารณาครับ`);
    console.log(`CEO Agent: Proposed trend to Boss: ${trend.title}`);
  }

  private startDailyReportLoop(): void {
    const interval = 12 * 60 * 60 * 1000; // Every 12 hours
    setInterval(async () => {
      if (!this.isBusy) {
        console.log("CEO Agent: Preparing daily status report...");
        const reportText = `บอสครับ รายงานสถานะประจำวัน:
- **งานที่กำลังดำเนินการ:** ${this.currentTask ? this.currentTask.overallGoal : 'ไม่มี'}
- **สถานะโดยรวม:** ระบบ Agentic ทำงานอย่างต่อเนื่องและมีประสิทธิภาพ
- **กิจกรรมสำคัญ:** ตรวจสอบความเรียบร้อยของระบบและเตรียมพร้อมสำหรับงานใหม่

หากมีข้อสงสัยเพิ่มเติม โปรดแจ้งได้เลยครับ`;
        await this.telegramComm.sendMessage(reportText);
        await this.discordComm.sendInternalMessage(`CEO: ส่งรายงานสถานะประจำวันให้บอสครับ`);
        console.log("CEO Agent: Sent daily status report to Boss.");
      }
    }, interval);
  }
}
