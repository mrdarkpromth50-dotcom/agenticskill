import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { Telegraf } from 'telegraf';
import { BossCommand } from './types';

// A unified communicator to handle multiple platforms
export class CommunicationService {
    private discordComm?: DiscordCommunicator;
    private telegramComm?: TelegramCommunicator;

    constructor() {
        const discordToken = process.env.DISCORD_BOT_TOKEN;
        const discordGuildId = process.env.DISCORD_GUILD_ID;
        const discordChannelId = process.env.DISCORD_CHANNEL_ID;

        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        if (discordToken && discordGuildId && discordChannelId) {
            this.discordComm = new DiscordCommunicator(discordToken, discordGuildId, discordChannelId);
            console.log("Discord communicator initialized.");
        } else {
            console.warn("Discord environment variables not set. Discord communicator disabled.");
        }

        if (telegramToken && telegramChatId) {
            this.telegramComm = new TelegramCommunicator(telegramToken, telegramChatId);
            console.log("Telegram communicator initialized.");
        } else {
            console.warn("Telegram environment variables not set. Telegram communicator disabled.");
        }
    }

    listenForCommands(callback: (command: BossCommand) => void) {
        this.discordComm?.listenForCommands(callback);
        this.telegramComm?.listenForCommands(callback);
        console.log("Started listening for commands on all available platforms.");
    }

    async reportToBoss(report: string) {
        console.log("Reporting to boss...");
        // Send to all configured platforms
        await this.discordComm?.sendMessage(report);
        await this.telegramComm?.sendMessage(report);
    }
}


class DiscordCommunicator {
    private client: Client;
    private guildId: string;
    private channelId: string;

    constructor(token: string, guildId: string, channelId: string) {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
        this.guildId = guildId;
        this.channelId = channelId;

        this.client.login(token).catch(err => console.error("Discord Login Error:", err));
        this.client.on('ready', () => console.log(`Discord: Logged in as ${this.client.user?.tag}!`));
    }

    async sendMessage(message: string): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(this.channelId) as TextChannel;
            if (channel) {
                await channel.send(message);
            }
        } catch (error) {
            console.error("Discord: Failed to send message:", error);
        }
    }

    listenForCommands(callback: (command: BossCommand) => void): void {
        this.client.on('messageCreate', msg => {
            if (msg.author.bot || msg.channel.id !== this.channelId) return;
            console.log(`Discord: Received command from ${msg.author.username}`);
            callback({ text: msg.content, sender: msg.author.username, source: 'discord' });
        });
    }
}

class TelegramCommunicator {
    private bot: Telegraf;
    private chatId: string;

    constructor(token: string, chatId: string) {
        this.bot = new Telegraf(token);
        this.chatId = chatId;
        this.bot.launch().catch(err => console.error("Telegram Launch Error:", err));
        console.log("Telegram: Bot launched.");
    }

    async sendMessage(message: string): Promise<void> {
        try {
            await this.bot.telegram.sendMessage(this.chatId, message);
        } catch (error) {
            console.error("Telegram: Failed to send message:", error);
        }
    }

    listenForCommands(callback: (command: BossCommand) => void): void {
        this.bot.on('text', ctx => {
            if (ctx.chat.id.toString() === this.chatId) {
                console.log(`Telegram: Received command from ${ctx.from?.username}`);
                callback({ text: ctx.message.text, sender: ctx.from?.username || 'Boss', source: 'telegram' });
            }
        });
    }
}
