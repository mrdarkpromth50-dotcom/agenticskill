import { BossCommand } from './types';
import axios from 'axios';
import express from 'express';

const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3014';
const TELEGRAM_BOT_URL = process.env.TELEGRAM_BOT_URL || 'http://localhost:3015';
const DISCORD_CHANNEL_CEO = process.env.DISCORD_CHANNEL_CEO_COMMANDS || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

/**
 * CommunicationService now uses HTTP APIs of the Discord Bot and Telegram Bot services
 * instead of creating separate bot instances (which causes token conflicts).
 */
export class CommunicationService {
  private commandCallback?: (command: BossCommand) => void;

  constructor() {
    console.log('[CommunicationService] Initialized with HTTP-based communication');
    console.log(`[CommunicationService] Discord Bot URL: ${DISCORD_BOT_URL}`);
    console.log(`[CommunicationService] Telegram Bot URL: ${TELEGRAM_BOT_URL}`);
  }

  /**
   * Listen for commands via the /command endpoint on the CEO Agent's Express app.
   * The Discord Bot and Telegram Bot forward commands to this endpoint.
   */
  listenForCommands(callback: (command: BossCommand) => void): void {
    this.commandCallback = callback;
    console.log('[CommunicationService] Ready to receive commands via /command endpoint');
  }

  /**
   * Report to boss via Discord and Telegram bot HTTP APIs
   */
  async reportToBoss(report: string): Promise<void> {
    console.log('[CommunicationService] Reporting to boss...');

    // Send via Discord Bot HTTP API
    if (DISCORD_CHANNEL_CEO) {
      try {
        await axios.post(`${DISCORD_BOT_URL}/send`, {
          channelId: DISCORD_CHANNEL_CEO,
          message: report.substring(0, 2000), // Discord message limit
        }, { timeout: 5000 });
        console.log('[CommunicationService] Sent report to Discord');
      } catch (error: any) {
        console.error('[CommunicationService] Failed to send to Discord:', error.message);
      }
    }

    // Send via Telegram Bot HTTP API
    if (TELEGRAM_CHAT_ID) {
      try {
        await axios.post(`${TELEGRAM_BOT_URL}/send`, {
          chatId: TELEGRAM_CHAT_ID,
          message: report.substring(0, 4096), // Telegram message limit
        }, { timeout: 5000 });
        console.log('[CommunicationService] Sent report to Telegram');
      } catch (error: any) {
        console.error('[CommunicationService] Failed to send to Telegram:', error.message);
      }
    }
  }

  /**
   * Send an embed to Discord
   */
  async sendEmbedToDiscord(channelId: string, embed: {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }): Promise<void> {
    try {
      await axios.post(`${DISCORD_BOT_URL}/send`, {
        channelId,
        embed,
      }, { timeout: 5000 });
    } catch (error: any) {
      console.error('[CommunicationService] Failed to send embed:', error.message);
    }
  }

  /**
   * Send system log to Discord
   */
  async sendSystemLog(message: string): Promise<void> {
    try {
      await axios.post(`${DISCORD_BOT_URL}/log`, { message }, { timeout: 5000 });
    } catch (error: any) {
      console.error('[CommunicationService] Failed to send system log:', error.message);
    }
  }
}
