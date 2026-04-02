export interface DiscordMessage {
  id: string;
  authorId: string;
  authorUsername: string;
  channelId: string;
  channelName: string;
  guildId: string;
  content: string;
  timestamp: number;
}

export interface DiscordChannelConfig {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category';
  purpose: string;
  agentsAllowed: string[]; // List of agent IDs allowed to access this channel
}
