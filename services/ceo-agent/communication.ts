import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { Telegraf } from 'telegraf';
import { BossCommand } from './types';

// Discord Communicator
export class DiscordCommunicator {
  private client: Client;
  private guildId: string;
  private internalChannelId: string = 'YOUR_INTERNAL_DISCORD_CHANNEL_ID'; // Replace with actual channel ID

  constructor(token: string, guildId: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.guildId = guildId;

    this.client.login(token);

    this.client.on('ready', () => {
      console.log(`Discord Communicator: Logged in as ${this.client.user?.tag}!`);
    });

    this.client.on('error', (error) => {
      console.error('Discord Client Error:', error);
    });
  }

  async sendInternalMessage(message: string): Promise<void> {
    try {
      const guild = await this.client.guilds.fetch(this.guildId);
      const channel = guild.channels.cache.get(this.internalChannelId) as TextChannel;
      if (channel) {
        await channel.send(message);
        console.log(`Discord Communicator: Sent internal message to channel ${this.internalChannelId}`);
      } else {
        console.warn(`Discord Communicator: Internal channel ${this.internalChannelId} not found.`);
      }
    } catch (error) {
      console.error('Discord Communicator: Failed to send internal message:', error);
    }
  }

  onInternalMessage(callback: (message: string) => void): void {
    this.client.on('messageCreate', (msg) => {
      if (msg.author.bot) return; // Ignore bot messages
      if (msg.channel.id === this.internalChannelId) {
        console.log(`Discord Communicator: Received internal message: ${msg.content}`);
        callback(msg.content);
      }
    });
  }
}

// Telegram Communicator
export class TelegramCommunicator {
  private bot: Telegraf;
  private chatId: string;

  constructor(token: string, chatId: string) {
    this.bot = new Telegraf(token);
    this.chatId = chatId;

    this.bot.launch();

    this.bot.catch((err, ctx) => {
      console.error(`Telegram Communicator: Error for ${ctx.updateType}`, err);
    });

    console.log('Telegram Communicator: Bot launched.');
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(this.chatId, message);
      console.log(`Telegram Communicator: Sent message to chat ID ${this.chatId}`);
    } catch (error) {
      console.error('Telegram Communicator: Failed to send message:', error);
    }
  }

  onCommand(callback: (command: BossCommand) => void): void {
    this.bot.on('text', (ctx) => {
      if (ctx.chat.id.toString() === this.chatId) {
        console.log(`Telegram Communicator: Received command from Boss: ${ctx.message.text}`);
        callback({ text: ctx.message.text, sender: ctx.from?.username || 'Boss' });
      }
    });
  }
}
