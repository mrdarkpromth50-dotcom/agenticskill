import { TelegramBot } from './bot';
import { CommandHandler } from './command-handler';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const HTTP_PORT = parseInt(process.env.TELEGRAM_BOT_HTTP_PORT || '3015');

async function main() {
  console.log('Starting Telegram Bot Service...');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in environment variables.');
    process.exit(1);
  }

  const commandHandler = new CommandHandler();
  const telegramBot = new TelegramBot(token, chatId, commandHandler);
  telegramBot.start();

  // HTTP API for other services to send messages via Telegram
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'telegram-bot', timestamp: Date.now() });
  });

  // Send message to CEO chat
  app.post('/send', async (req, res) => {
    const { chatId: targetChatId, message } = req.body;
    const target = targetChatId || chatId;
    try {
      await telegramBot.sendMessage(target, message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Alert endpoint
  app.post('/alert', async (req, res) => {
    const { message } = req.body;
    try {
      await telegramBot.sendMessage(chatId, `🚨 Alert: ${message}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(HTTP_PORT, () => {
    console.log(`Telegram Bot HTTP API listening on port ${HTTP_PORT}`);
  });

  console.log('Telegram Bot Service started.');
}

main().catch(error => {
  console.error('Telegram Bot Service failed to start:', error);
  process.exit(1);
});
