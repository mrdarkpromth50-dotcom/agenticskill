import { BossCommand, TaskPlan, SubTask, CEOStatus } from './types';
import { CommunicationService } from './communication';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3002';

export class CEOAgent {
  private communication: CommunicationService;
  private activePlans: Map<string, TaskPlan> = new Map();
  private status: 'idle' | 'busy' | 'error' = 'idle';
  private lastCommand?: string;

  constructor() {
    this.communication = new CommunicationService();
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
      const plan = await this.analyzeAndPlan(command);
      this.activePlans.set(plan.id, plan);
      
      await this.communication.reportToBoss(`รับทราบครับบอส! ผมได้วางแผนงานสำหรับ "${plan.overallGoal}" เรียบร้อยแล้ว โดยแบ่งเป็น ${plan.subTasks.length} งานย่อยครับ`);
      
      for (const task of plan.subTasks) {
        await this.delegateTask(plan.id, task);
      }
    } catch (error) {
      console.error("CEO Agent: Error processing command:", error);
      this.status = 'error';
      await this.communication.reportToBoss(`ขออภัยครับบอส เกิดข้อผิดพลาดในการประมวลผลคำสั่ง: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async analyzeAndPlan(command: BossCommand): Promise<TaskPlan> {
    console.log("CEO Agent: Analyzing command and creating plan...");
    // In a real scenario, this would call an LLM to break down the command.
    const planId = uuidv4();
    const subTasks: SubTask[] = [
      {
        id: uuidv4(),
        description: `Research about: ${command.text}`,
        assignedAgentType: 'researcher',
        status: 'pending'
      },
      {
        id: uuidv4(),
        description: `Summarize findings for: ${command.text}`,
        assignedAgentType: 'summarizer',
        status: 'pending'
      }
    ];

    return {
      id: planId,
      bossCommand: command.text,
      overallGoal: `Process command: ${command.text}`,
      subTasks,
      status: 'planning',
      createdAt: Date.now()
    };
  }

  private async delegateTask(planId: string, subTask: SubTask): Promise<void> {
    console.log(`CEO Agent: Delegating subtask ${subTask.id} to Spawn Manager...`);
    try {
      const response = await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: subTask.assignedAgentType,
        description: subTask.description,
        payload: { planId, subTaskId: subTask.id }
      });

      subTask.spawnTaskId = response.data.id;
      subTask.status = 'in-progress';
      
      // Start tracking progress
      this.trackProgress(planId, subTask.id);
    } catch (error) {
      console.error(`CEO Agent: Failed to delegate subtask ${subTask.id}:`, error);
      subTask.status = 'failed';
      subTask.error = 'Failed to connect to Spawn Manager';
    }
  }

  private async trackProgress(planId: string, subTaskId: string): Promise<void> {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    const subTask = plan.subTasks.find(t => t.id === subTaskId);
    if (!subTask || !subTask.spawnTaskId) return;

    const checkInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${SPAWN_MANAGER_URL}/tasks/${subTask.spawnTaskId}`);
        const taskData = response.data;

        if (taskData.status === 'completed') {
          clearInterval(checkInterval);
          subTask.status = 'completed';
          subTask.result = taskData.result;
          console.log(`CEO Agent: Subtask ${subTaskId} completed.`);
          await this.checkPlanCompletion(planId);
        } else if (taskData.status === 'failed') {
          clearInterval(checkInterval);
          subTask.status = 'failed';
          subTask.error = taskData.error;
          console.error(`CEO Agent: Subtask ${subTaskId} failed.`);
          await this.checkPlanCompletion(planId);
        }
      } catch (error) {
        console.error(`CEO Agent: Error tracking subtask ${subTaskId}:`, error);
      }
    }, 10000); // Check every 10 seconds
  }

  private async checkPlanCompletion(planId: string): Promise<void> {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    const allFinished = plan.subTasks.every(t => t.status === 'completed' || t.status === 'failed');
    if (allFinished) {
      plan.status = plan.subTasks.every(t => t.status === 'completed') ? 'completed' : 'failed';
      plan.completedAt = Date.now();
      
      const report = this.consolidateResults(plan);
      await this.communication.reportToBoss(report);
      
      this.activePlans.delete(planId);
      if (this.activePlans.size === 0) this.status = 'idle';
    }
  }

  private consolidateResults(plan: TaskPlan): string {
    let report = `บอสครับ! งานสำหรับ "${plan.bossCommand}" เสร็จสิ้นแล้วครับ\n\n`;
    plan.subTasks.forEach((t, i) => {
      report += `${i + 1}. ${t.description}: ${t.status === 'completed' ? '✅ สำเร็จ' : '❌ ล้มเหลว (' + t.error + ')'}\n`;
    });
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
      lastCommand: this.lastCommand
    };
  }

  getActiveTasks(): TaskPlan[] {
    return Array.from(this.activePlans.values());
  }

  async triggerReport(): Promise<void> {
    const status = this.getStatus();
    let report = `รายงานสถานะ CEO Agent:\n- สถานะ: ${status.status}\n- งานที่กำลังดำเนินการ: ${status.activePlans}\n- คำสั่งล่าสุด: ${status.lastCommand || 'ไม่มี'}`;
    await this.communication.reportToBoss(report);
  }
}
