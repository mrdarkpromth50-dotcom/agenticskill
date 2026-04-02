import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { ChannelManager } from './channel-manager';
import { DiscordMessage } from './types';

export class DiscordBot {
  private client: Client;
  private channelManager: ChannelManager;

  constructor(token: string, channelManager: ChannelManager) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.channelManager = channelManager;

    this.client.login(token);

    this.client.on('ready', () => {
      console.log(`Discord Bot: Logged in as ${this.client.user?.tag}!`);
      this.channelManager.initialize(this.client);
    });

    this.client.on('messageCreate', this.handleMessage.bind(this));

    this.client.on('error', (error) => {
      console.error('Discord Bot Client Error:', error);
    });
  }

  async start(): Promise<void> {
    console.log('Discord Bot: Starting...');
    // Any additional startup logic can go here
  }

  private async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return; // Ignore bot messages

    console.log(`Discord Bot: Received message from ${message.author.tag} in #${(message.channel as TextChannel).name}: ${message.content}`);

    // Forward message to OpenClaw Gateway or relevant service
    // For now, we'll just echo or process simple commands
    if (message.content.startsWith('!status')) {
      await message.reply('Discord Bot is online and operational!');
    } else if (message.content.startsWith('!create_channel')) {
      const channelName = message.content.split(' ')[1];
      if (channelName) {
        const newChannel = await this.channelManager.createAgentChannel(channelName);
        if (newChannel) {
          await message.reply(`Created new agent channel: ${newChannel.name}`);
        } else {
          await message.reply(`Failed to create channel ${channelName}.`);
        }
      } else {
        await message.reply('Please provide a channel name: !create_channel <name>');
      }
    }

    // Example of sending a message to an internal Agent (e.g., CEO)
    // This would typically go through OpenClaw Gateway
    // const discordMessage: DiscordMessage = {
    //   id: message.id,
    //   authorId: message.author.id,
    //   authorUsername: message.author.username,
    //   channelId: message.channel.id,
    //   channelName: (message.channel as TextChannel).name,
    //   guildId: message.guildId!,
    //   content: message.content,
    //   timestamp: message.createdTimestamp,
    // };
    // console.log('Forwarding message to OpenClaw Gateway:', discordMessage);
  }

  async sendMessageToChannel(channelId: string, message: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (channel) {
        await channel.send(message);
        console.log(`Discord Bot: Sent message to channel ${channel.name} (${channelId})`);
      } else {
        console.warn(`Discord Bot: Channel ${channelId} not found.`);
      }
    } catch (error) {
      console.error(`Discord Bot: Failed to send message to channel ${channelId}:`, error);
    }
  }
}
