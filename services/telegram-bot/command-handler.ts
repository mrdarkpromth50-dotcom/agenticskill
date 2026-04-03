import { TelegramMessage } from './types';
import axios from 'axios';

const CEO_AGENT_URL = process.env.CEO_AGENT_URL || 'http://localhost:3004';

export class CommandHandler {
  constructor() {}

  async handleCommand(message: TelegramMessage): Promise<void> {
    console.log(`CommandHandler: Processing command from Telegram: ${message.content}`);

    try {
      await axios.post(`${CEO_AGENT_URL}/command`, {
        text: message.content,
        sender: message.senderUsername,
        source: 'telegram',
        chatId: message.chatId,
      }, { timeout: 10000 });
      console.log('CommandHandler: Command forwarded to CEO Agent');
    } catch (error) {
      console.error('CommandHandler: Failed to forward to CEO Agent:', error);
    }
  }
}
