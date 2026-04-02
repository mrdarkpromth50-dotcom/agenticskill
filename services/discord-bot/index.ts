import { DiscordBot } from './bot';
import { ChannelManager } from './channel-manager';

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

  console.log('Discord Bot Service started.');
}

main().catch(error => {
  console.error('Discord Bot Service failed to start:', error);
  process.exit(1);
});
