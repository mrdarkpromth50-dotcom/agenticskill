import { TelegramMessage } from './types';

export class CommandHandler {
  constructor() {}

  async handleCommand(message: TelegramMessage): Promise<void> {
    console.log(`CommandHandler: Processing command from Telegram: ${message.content}`);
    // In a real system, this would involve sending the command to the CEO Agent
    // via a message queue or direct service call.
    // For now, we just log it.
    // Example: send to CEO Agent
    // await CEOServiceClient.receiveBossCommand({ text: message.content, sender: message.senderUsername });
  }
}
