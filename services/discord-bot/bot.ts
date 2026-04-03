import { Client, GatewayIntentBits, Message, TextChannel, EmbedBuilder } from 'discord.js';
import { ChannelManager } from './channel-manager';
import { DiscordMessage } from './types';
import axios from 'axios';

const CEO_AGENT_URL = process.env.CEO_AGENT_URL || 'http://localhost:3004';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';

export class DiscordBot {
  private client: Client;
  private channelManager: ChannelManager;
  private channelIds: Record<string, string>;

  constructor(token: string, channelManager: ChannelManager) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.channelManager = channelManager;

    this.channelIds = {
      dailyStandup: process.env.DISCORD_CHANNEL_DAILY_STANDUP || '',
      agentStatus: process.env.DISCORD_CHANNEL_AGENT_STATUS || '',
      financeAlerts: process.env.DISCORD_CHANNEL_FINANCE_ALERTS || '',
      ceoCommands: process.env.DISCORD_CHANNEL_CEO_COMMANDS || '',
      trendResearch: process.env.DISCORD_CHANNEL_TREND_RESEARCH || '',
      systemLogs: process.env.DISCORD_CHANNEL_SYSTEM_LOGS || '',
      general: process.env.DISCORD_CHANNEL_GENERAL || '',
    };

    this.client.login(token);

    this.client.on('ready', () => {
      console.log(`Discord Bot: Logged in as ${this.client.user?.tag}!`);
      console.log(`Discord Bot: Serving ${this.client.guilds.cache.size} guild(s)`);
      this.channelManager.initialize(this.client);

      this.sendEmbedToChannel(this.channelIds.systemLogs, {
        title: '🤖 Discord Bot Online',
        description: 'AgenticSkill Discord Bot has started successfully.',
        color: 0x00ff00,
        fields: [
          { name: 'Bot', value: this.client.user?.tag || 'Unknown', inline: true },
          { name: 'Guilds', value: String(this.client.guilds.cache.size), inline: true },
          { name: 'Time', value: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), inline: true },
        ],
      });
    });

    this.client.on('messageCreate', this.handleMessage.bind(this));
    this.client.on('error', (error) => {
      console.error('Discord Bot Client Error:', error);
    });
  }

  async start(): Promise<void> {
    console.log('Discord Bot: Starting...');
  }

  private async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;

    const channelName = (message.channel as TextChannel).name || 'DM';
    console.log(`Discord Bot: [#${channelName}] ${message.author.username}: ${message.content}`);

    if (message.content.startsWith('!')) {
      await this.handleCommand(message);
      return;
    }

    if (message.channel.id === this.channelIds.ceoCommands) {
      await this.forwardToCEO(message);
    }
  }

  private async handleCommand(message: Message): Promise<void> {
    const args = message.content.slice(1).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    switch (command) {
      case 'status':
        await this.handleStatusCommand(message);
        break;
      case 'agents':
        await this.handleAgentsCommand(message);
        break;
      case 'trend':
        await this.handleTrendCommand(message);
        break;
      case 'finance':
        await this.handleFinanceCommand(message);
        break;
      case 'health':
        await this.handleHealthCommand(message);
        break;
      case 'help':
        await this.handleHelpCommand(message);
        break;
      case 'create_channel':
        const chName = args[0];
        if (chName) {
          const newChannel = await this.channelManager.createAgentChannel(chName);
          if (newChannel) {
            await message.reply(`Created new agent channel: ${newChannel.name}`);
          } else {
            await message.reply(`Failed to create channel ${chName}.`);
          }
        } else {
          await message.reply('Please provide a channel name: !create_channel <name>');
        }
        break;
      default:
        await message.reply(`Unknown command: \`!${command}\`. Use \`!help\` for available commands.`);
    }
  }

  private async handleStatusCommand(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🤖 AgenticSkill System Status')
      .setColor(0x00ff00)
      .setTimestamp()
      .addFields(
        { name: 'Discord Bot', value: '✅ Online', inline: true },
        { name: 'Uptime', value: this.formatUptime(this.client.uptime || 0), inline: true },
        { name: 'Guilds', value: String(this.client.guilds.cache.size), inline: true },
      );
    await message.reply({ embeds: [embed] });
  }

  private async handleAgentsCommand(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🏢 Agent Town - Active Agents')
      .setColor(0x3498db)
      .setTimestamp()
      .setDescription('List of all registered agents in the system');

    const agents = [
      { name: '👔 CEO Agent', port: 3004 },
      { name: '💰 Accountant Agent', port: 3009 },
      { name: '🔧 CTO Agent', port: 3010 },
      { name: '📢 CMO Agent', port: 3011 },
      { name: '📊 CSO Agent', port: 3012 },
      { name: '🚀 DevOps Agent', port: 3013 },
    ];

    for (const agent of agents) {
      try {
        await axios.get(`http://localhost:${agent.port}/health`, { timeout: 2000 });
        embed.addFields({ name: agent.name, value: '✅ Running', inline: true });
      } catch {
        embed.addFields({ name: agent.name, value: '⏸️ Standby', inline: true });
      }
    }
    await message.reply({ embeds: [embed] });
  }

  private async handleTrendCommand(message: Message): Promise<void> {
    await message.reply('🔍 Requesting trend research from CEO Agent...');
    try {
      const response = await axios.post(`${CEO_AGENT_URL}/trend-research`, {}, { timeout: 30000 });
      const trends = response.data;
      const embed = new EmbedBuilder()
        .setTitle('📊 Latest Trend Research')
        .setColor(0xe67e22)
        .setTimestamp();

      if (Array.isArray(trends) && trends.length > 0) {
        for (const trend of trends.slice(0, 5)) {
          embed.addFields({ name: trend.title || 'Trend', value: trend.summary || 'No summary', inline: false });
        }
      } else {
        embed.setDescription('No trends available. CEO Agent may be processing...');
      }
      await message.reply({ embeds: [embed] });
    } catch {
      await message.reply('❌ Could not fetch trends. CEO Agent may be offline.');
    }
  }

  private async handleFinanceCommand(message: Message): Promise<void> {
    try {
      const response = await axios.get(`${process.env.ACCOUNTANT_AGENT_URL || 'http://localhost:3009'}/summary`, { timeout: 5000 });
      const summary = response.data;
      const embed = new EmbedBuilder()
        .setTitle('💰 Financial Summary')
        .setColor(0x2ecc71)
        .setTimestamp()
        .addFields(
          { name: 'Total Income', value: `${summary.totalIncome || 0} THB`, inline: true },
          { name: 'Total Expense', value: `${summary.totalExpense || 0} THB`, inline: true },
          { name: 'Net Balance', value: `${summary.netBalance || 0} THB`, inline: true },
        );
      await message.reply({ embeds: [embed] });
    } catch {
      await message.reply('❌ Could not fetch financial summary. Accountant Agent may be offline.');
    }
  }

  private async handleHealthCommand(message: Message): Promise<void> {
    await message.reply('🏥 Running system health check...');
    const services = [
      { name: 'Memory System', port: 3001 },
      { name: 'Persistent Agent', port: 3002 },
      { name: 'Spawn Manager', port: 3003 },
      { name: 'CEO Agent', port: 3004 },
      { name: 'Translation', port: 3005 },
      { name: 'Account Mgr', port: 3006 },
      { name: 'Monitoring', port: 3008 },
      { name: 'Accountant', port: 3009 },
      { name: 'CTO Agent', port: 3010 },
      { name: 'CMO Agent', port: 3011 },
      { name: 'CSO Agent', port: 3012 },
      { name: 'DevOps Agent', port: 3013 },
    ];

    const embed = new EmbedBuilder()
      .setTitle('🏥 System Health Check')
      .setColor(0x3498db)
      .setTimestamp();

    let online = 0;
    for (const svc of services) {
      try {
        await axios.get(`http://localhost:${svc.port}/health`, { timeout: 2000 });
        embed.addFields({ name: svc.name, value: `✅ :${svc.port}`, inline: true });
        online++;
      } catch {
        embed.addFields({ name: svc.name, value: `❌ :${svc.port}`, inline: true });
      }
    }
    embed.setDescription(`**Online:** ${online}/${services.length}`);
    await message.reply({ embeds: [embed] });
  }

  private async handleHelpCommand(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('📖 AgenticSkill Bot Commands')
      .setColor(0x9b59b6)
      .addFields(
        { name: '!status', value: 'System status', inline: true },
        { name: '!agents', value: 'List agents', inline: true },
        { name: '!trend', value: 'Get trends', inline: true },
        { name: '!finance', value: 'Finance summary', inline: true },
        { name: '!health', value: 'Health check', inline: true },
        { name: '!help', value: 'This help', inline: true },
      );
    await message.reply({ embeds: [embed] });
  }

  private async forwardToCEO(message: Message): Promise<void> {
    const discordMessage: DiscordMessage = {
      id: message.id,
      authorId: message.author.id,
      authorUsername: message.author.username,
      channelId: message.channel.id,
      channelName: (message.channel as TextChannel).name,
      guildId: message.guildId!,
      content: message.content,
      timestamp: message.createdTimestamp,
    };

    try {
      await axios.post(`${CEO_AGENT_URL}/command`, {
        text: message.content,
        sender: message.author.username,
        source: 'discord',
        metadata: discordMessage,
      }, { timeout: 10000 });
      await message.react('✅');
    } catch {
      await message.react('❌');
    }
  }

  async sendMessageToChannel(channelId: string, content: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (channel) {
        await channel.send(content);
      }
    } catch (error) {
      console.error(`Discord Bot: Failed to send to ${channelId}:`, error);
    }
  }

  async sendEmbedToChannel(channelId: string, embedData: {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }): Promise<void> {
    if (!channelId) return;
    try {
      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(embedData.title)
          .setColor(embedData.color || 0x3498db)
          .setTimestamp();
        if (embedData.description) embed.setDescription(embedData.description);
        if (embedData.fields) {
          for (const field of embedData.fields) {
            embed.addFields(field);
          }
        }
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Discord Bot: Failed to send embed to ${channelId}:`, error);
    }
  }

  getClient(): Client { return this.client; }
  getChannelIds(): Record<string, string> { return this.channelIds; }

  private formatUptime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${m % 60}m`;
  }
}
