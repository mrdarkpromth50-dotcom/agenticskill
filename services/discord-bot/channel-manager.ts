import { Client, Guild, TextChannel, ChannelType } from 'discord.js';

export class ChannelManager {
  private guild: Guild | null = null;

  constructor(private guildId: string) {}

  async initialize(client: Client): Promise<void> {
    try {
      this.guild = await client.guilds.fetch(this.guildId);
      console.log(`ChannelManager: Initialized for guild: ${this.guild.name}`);
    } catch (error) {
      console.error(`ChannelManager: Failed to initialize for guild ${this.guildId}:`, error);
    }
  }

  async createAgentChannel(channelName: string, parentId?: string): Promise<TextChannel | null> {
    if (!this.guild) {
      console.error('ChannelManager: Guild not initialized.');
      return null;
    }

    try {
      const newChannel = await this.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentId, // Optional: category ID
        topic: `ช่องทางการสื่อสารสำหรับ Agent: ${channelName}`,
        permissionOverwrites: [
          // Example: Deny @everyone to view channel, allow specific roles/bots
          // This needs careful configuration based on security requirements
        ],
      });
      console.log(`ChannelManager: Created new channel: ${newChannel.name} (${newChannel.id})`);
      return newChannel as TextChannel;
    } catch (error) {
      console.error(`ChannelManager: Failed to create channel ${channelName}:`, error);
      return null;
    }
  }

  async getChannel(channelId: string): Promise<TextChannel | null> {
    if (!this.guild) {
      console.error('ChannelManager: Guild not initialized.');
      return null;
    }
    try {
      const channel = await this.guild.channels.fetch(channelId);
      if (channel && channel.type === ChannelType.GuildText) {
        return channel as TextChannel;
      }
      return null;
    } catch (error) {
      console.error(`ChannelManager: Failed to fetch channel ${channelId}:`, error);
      return null;
    }
  }

  // Add methods for deleting channels, updating permissions, etc.
}
