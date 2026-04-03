import { Telegraf } from 'telegraf';
import { CommandHandler } from './command-handler';
import { TelegramMessage } from './types';
import axios from 'axios';

const CEO_AGENT_URL = process.env.CEO_AGENT_URL || 'http://localhost:3004';

export class TelegramBot {
  private bot: Telegraf;
  private ceoChatId: string;
  private commandHandler: CommandHandler;

  constructor(token: string, ceoChatId: string, commandHandler: CommandHandler) {
    this.bot = new Telegraf(token);
    this.ceoChatId = ceoChatId;
    this.commandHandler = commandHandler;

    this.bot.start((ctx) => ctx.reply(
      '🤖 สวัสดีครับ! ผมคือ AgenticSkill Bot\n\n' +
      'คำสั่งที่ใช้ได้:\n' +
      '/status - ดูสถานะระบบ\n' +
      '/agents - ดูรายชื่อ Agents\n' +
      '/trend - ดูเทรนด์ล่าสุด\n' +
      '/finance - สรุปการเงิน\n' +
      '/health - ตรวจสอบสุขภาพระบบ\n' +
      '/help - คำสั่งทั้งหมด'
    ));

    this.bot.help((ctx) => ctx.reply(
      '📖 คำสั่งทั้งหมด:\n' +
      '/status - สถานะระบบ\n' +
      '/agents - รายชื่อ Agents\n' +
      '/trend - เทรนด์ล่าสุด\n' +
      '/finance - สรุปการเงิน\n' +
      '/health - ตรวจสอบระบบ\n\n' +
      'หรือพิมพ์ข้อความใดๆ เพื่อส่งคำสั่งไปยัง CEO Agent'
    ));

    this.bot.command('status', async (ctx) => {
      await ctx.reply(
        '🤖 AgenticSkill System Status\n' +
        `✅ Telegram Bot: Online\n` +
        `⏰ Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`
      );
    });

    this.bot.command('agents', async (ctx) => {
      const agents = ['CEO', 'Accountant', 'CTO', 'CMO', 'CSO', 'DevOps'];
      let msg = '🏢 Agent Town - Agents:\n\n';
      for (const a of agents) {
        msg += `🤖 ${a} Agent\n`;
      }
      await ctx.reply(msg);
    });

    this.bot.command('trend', async (ctx) => {
      await ctx.reply('🔍 กำลังค้นหาเทรนด์ล่าสุด...');
      try {
        const response = await axios.post(`${CEO_AGENT_URL}/trend-research`, {}, { timeout: 30000 });
        const trends = response.data;
        if (Array.isArray(trends) && trends.length > 0) {
          let msg = '📊 Trend Research Results:\n\n';
          for (const t of trends.slice(0, 5)) {
            msg += `📌 ${t.title}\n${t.summary}\n\n`;
          }
          await ctx.reply(msg);
        } else {
          await ctx.reply('ไม่พบเทรนด์ใหม่ในขณะนี้');
        }
      } catch {
        await ctx.reply('❌ ไม่สามารถดึงข้อมูลเทรนด์ได้ CEO Agent อาจ offline');
      }
    });

    this.bot.command('finance', async (ctx) => {
      try {
        const response = await axios.get(`${process.env.ACCOUNTANT_AGENT_URL || 'http://localhost:3009'}/summary`, { timeout: 5000 });
        const s = response.data;
        await ctx.reply(
          `💰 Financial Summary\n\n` +
          `📈 Income: ${s.totalIncome || 0} THB\n` +
          `📉 Expense: ${s.totalExpense || 0} THB\n` +
          `💵 Net: ${s.netBalance || 0} THB`
        );
      } catch {
        await ctx.reply('❌ ไม่สามารถดึงข้อมูลการเงินได้');
      }
    });

    this.bot.command('health', async (ctx) => {
      await ctx.reply('🏥 กำลังตรวจสอบระบบ...');
      const services = [
        { name: 'Memory', port: 3001 },
        { name: 'CEO', port: 3004 },
        { name: 'Accountant', port: 3009 },
        { name: 'CTO', port: 3010 },
      ];
      let msg = '🏥 Health Check:\n\n';
      for (const svc of services) {
        try {
          await axios.get(`http://localhost:${svc.port}/health`, { timeout: 2000 });
          msg += `✅ ${svc.name} (:${svc.port})\n`;
        } catch {
          msg += `❌ ${svc.name} (:${svc.port})\n`;
        }
      }
      await ctx.reply(msg);
    });

    this.bot.on('text', this.handleMessage.bind(this));

    this.bot.catch((err: any, ctx: any) => {
      console.error(`Telegram Bot: Error for ${ctx.updateType}`, err);
    });
  }

  start(): void {
    this.bot.launch();
    console.log('Telegram Bot: Launched and listening for messages.');
  }

  private async handleMessage(ctx: any): Promise<void> {
    const messageText = ctx.message.text;
    const senderChatId = ctx.chat.id.toString();

    console.log(`Telegram Bot: [${ctx.from?.username || 'unknown'}] ${messageText}`);

    if (senderChatId === this.ceoChatId) {
      const telegramMessage: TelegramMessage = {
        id: ctx.message.message_id.toString(),
        senderId: ctx.from?.id.toString() || 'unknown',
        senderUsername: ctx.from?.username || 'unknown',
        chatId: senderChatId,
        content: messageText,
        timestamp: ctx.message.date,
      };

      this.commandHandler.handleCommand(telegramMessage);

      try {
        await axios.post(`${CEO_AGENT_URL}/command`, {
          text: messageText,
          sender: ctx.from?.username || 'unknown',
          source: 'telegram',
          metadata: telegramMessage,
        }, { timeout: 10000 });
        await ctx.reply('✅ รับทราบคำสั่งแล้วครับ CEO Agent กำลังดำเนินการ...');
      } catch {
        await ctx.reply('⚠️ รับคำสั่งแล้ว แต่ CEO Agent อาจ offline');
      }
    } else {
      await ctx.reply('ขออภัยครับ ผมรับคำสั่งได้เฉพาะจาก Boss ที่กำหนดไว้เท่านั้น');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
      console.log(`Telegram Bot: Sent message to chat ID ${chatId}`);
    } catch (error) {
      console.error(`Telegram Bot: Failed to send message to chat ID ${chatId}:`, error);
    }
  }

  getBotInstance(): Telegraf {
    return this.bot;
  }
}
