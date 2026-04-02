export interface TelegramMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  chatId: string;
  content: string;
  timestamp: number;
}
