import { Telegraf } from 'telegraf';
import { CommandHandler } from './command-handler';
import { TelegramMessage } from './types';

export class TelegramBot {
  private bot: Telegraf;
  private ceoChatId: string;
  private commandHandler: CommandHandler;

  constructor(token: string, ceoChatId: string, commandHandler: CommandHandler) {
    this.bot = new Telegraf(token);
    this.ceoChatId = ceoChatId;
    this.commandHandler = commandHandler;

    this.bot.start((ctx) => ctx.reply('Welcome! I am the Agentic Company Telegram Bot.'));
    this.bot.help((ctx) => ctx.reply('Send me a message and I will forward it to the CEO.'));

    this.bot.on('text', this.handleMessage.bind(this));

    this.bot.catch((err, ctx) => {
      console.error(`Telegram Bot: Error for ${ctx.updateType}`, err);
      if (ctx.chat) {
        ctx.reply('An error occurred while processing your request.');
      }
    });
  }

  start(): void {
    this.bot.launch();
    console.log('Telegram Bot: Launched and listening for messages.');
  }

  private async handleMessage(ctx: any): Promise<void> {
    const messageText = ctx.message.text;
    const senderChatId = ctx.chat.id.toString();

    console.log(`Telegram Bot: Received message from ${ctx.from?.username || 'unknown'} (Chat ID: ${senderChatId}): ${messageText}`);

    // Only process messages from the CEO's designated chat ID
    if (senderChatId === this.ceoChatId) {
      const telegramMessage: TelegramMessage = {
        id: ctx.message.message_id.toString(),
        senderId: ctx.from?.id.toString() || 'unknown',
        senderUsername: ctx.from?.username || 'unknown',
        chatId: senderChatId,
        content: messageText,
        timestamp: ctx.message.date,
      };
      
      // Forward to command handler or CEO Agent directly
      // For now, we'll assume messages from CEO_CHAT_ID are commands for the CEO Agent
      this.commandHandler.handleCommand(telegramMessage);
      // Acknowledge receipt to the Boss
      await ctx.reply('รับทราบคำสั่งแล้วครับ CEO Agent กำลังดำเนินการ...');
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
}
