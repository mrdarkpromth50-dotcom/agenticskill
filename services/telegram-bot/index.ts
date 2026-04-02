import { TelegramBot } from './bot';
import { CommandHandler } from './command-handler';

async function main() {
  console.log('Starting Telegram Bot Service...');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID; // CEO's chat ID

  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in environment variables.');
    process.exit(1);
  }

  const commandHandler = new CommandHandler();
  const telegramBot = new TelegramBot(token, chatId, commandHandler);

  telegramBot.start();

  console.log('Telegram Bot Service started.');
}

main().catch(error => {
  console.error('Telegram Bot Service failed to start:', error);
  process.exit(1);
});
