import { DiscordBot } from './bot';
import { ChannelManager } from './channel-manager';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const HTTP_PORT = parseInt(process.env.DISCORD_BOT_HTTP_PORT || '3014');

async function main() {
  console.log('Starting Discord Bot Service...');

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    console.error('DISCORD_BOT_TOKEN or DISCORD_GUILD_ID not set in environment variables.');
    process.exit(1);
  }

  const channelManager = new ChannelManager(guildId);
  const discordBot = new DiscordBot(token, channelManager);
  await discordBot.start();

  // HTTP API for other services to send messages via Discord
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'discord-bot', timestamp: Date.now() });
  });

  // Send message to a specific channel
  app.post('/send', async (req, res) => {
    const { channelId, message, embed } = req.body;
    if (!channelId || (!message && !embed)) {
      return res.status(400).json({ error: 'channelId and (message or embed) are required' });
    }
    try {
      if (embed) {
        await discordBot.sendEmbedToChannel(channelId, embed);
      } else {
        await discordBot.sendMessageToChannel(channelId, message);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send alert to finance channel
  app.post('/alert/finance', async (req, res) => {
    const { message, embed } = req.body;
    const channelId = discordBot.getChannelIds().financeAlerts;
    if (!channelId) {
      return res.status(500).json({ error: 'Finance alerts channel not configured' });
    }
    try {
      if (embed) {
        await discordBot.sendEmbedToChannel(channelId, embed);
      } else {
        await discordBot.sendMessageToChannel(channelId, message);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send trend research results
  app.post('/trend', async (req, res) => {
    const { message, embed } = req.body;
    const channelId = discordBot.getChannelIds().trendResearch;
    if (!channelId) {
      return res.status(500).json({ error: 'Trend research channel not configured' });
    }
    try {
      if (embed) {
        await discordBot.sendEmbedToChannel(channelId, embed);
      } else {
        await discordBot.sendMessageToChannel(channelId, message);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send system log
  app.post('/log', async (req, res) => {
    const { message, embed } = req.body;
    const channelId = discordBot.getChannelIds().systemLogs;
    if (!channelId) {
      return res.status(500).json({ error: 'System logs channel not configured' });
    }
    try {
      if (embed) {
        await discordBot.sendEmbedToChannel(channelId, embed);
      } else {
        await discordBot.sendMessageToChannel(channelId, message);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agent status update
  app.post('/agent-status', async (req, res) => {
    const { message, embed } = req.body;
    const channelId = discordBot.getChannelIds().agentStatus;
    if (!channelId) {
      return res.status(500).json({ error: 'Agent status channel not configured' });
    }
    try {
      if (embed) {
        await discordBot.sendEmbedToChannel(channelId, embed);
      } else {
        await discordBot.sendMessageToChannel(channelId, message);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(HTTP_PORT, () => {
    console.log(`Discord Bot HTTP API listening on port ${HTTP_PORT}`);
  });

  console.log('Discord Bot Service started.');
}

main().catch(error => {
  console.error('Discord Bot Service failed to start:', error);
  process.exit(1);
});
