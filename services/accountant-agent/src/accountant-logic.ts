import { TransactionMonitor } from './transaction-monitor';
import { Transaction, FinancialRecord, AlertConfig, FinancialSummary } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3014';
const DISCORD_CHANNEL_FINANCE = process.env.DISCORD_CHANNEL_FINANCE_ALERTS || '';
const BANK_API_URL = process.env.BANK_API_URL || 'http://mock-bank-api:8000';
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'http://mock-payment-gateway:8001';

export class AccountantAgent {
  private transactionMonitor: TransactionMonitor;
  private financialRecords: FinancialRecord[] = [];
  private alertThreshold: number;
  private totalIncome: number = 0;
  private totalExpense: number = 0;

  constructor() {
    this.transactionMonitor = new TransactionMonitor(BANK_API_URL, PAYMENT_GATEWAY_URL);
    this.alertThreshold = parseFloat(process.env.FINANCE_ALERT_THRESHOLD || '10000');
  }

  public async start(): Promise<void> {
    console.log('Accountant Agent: Starting financial monitoring...');
    const monitoringInterval = parseInt(process.env.TRANSACTION_MONITOR_INTERVAL || '60000');
    this.transactionMonitor.startMonitoring(monitoringInterval, this.handleNewTransactions.bind(this));

    // Send startup notification to Discord
    await this.sendDiscordAlert({
      title: '💰 Accountant Agent Online',
      description: 'Financial monitoring system is active and running 24/7.',
      color: 0x2ecc71,
      fields: [
        { name: 'Alert Threshold', value: `${this.alertThreshold} THB`, inline: true },
        { name: 'Monitor Interval', value: `${monitoringInterval / 1000}s`, inline: true },
        { name: 'Status', value: '✅ Active', inline: true },
      ],
    });

    // Daily summary at midnight
    this.scheduleDailySummary();
  }

  private scheduleDailySummary(): void {
    // Calculate ms until next midnight Bangkok time
    const now = new Date();
    const bangkokOffset = 7 * 60 * 60 * 1000;
    const bangkokNow = new Date(now.getTime() + bangkokOffset);
    const nextMidnight = new Date(bangkokNow);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - bangkokNow.getTime();

    setTimeout(() => {
      this.sendDailySummaryToDiscord();
      // Then every 24 hours
      setInterval(() => this.sendDailySummaryToDiscord(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log(`Accountant Agent: Daily summary scheduled in ${Math.round(msUntilMidnight / 60000)} minutes`);
  }

  private async handleNewTransactions(transactions: Transaction[]): Promise<void> {
    for (const tx of transactions) {
      console.log(`Accountant Agent: Processing transaction: ${tx.id} - ${tx.amount} ${tx.currency} (${tx.type})`);
      const record = await this.processTransaction(tx);
      if (record) {
        this.financialRecords.push(record);
        await this.saveToMemory(record);

        // Track totals
        if (tx.type === 'income') {
          this.totalIncome += tx.amount;
        } else {
          this.totalExpense += tx.amount;
        }

        // Always send alert to Discord for every transaction
        await this.sendTransactionAlert(tx);

        // Extra alert for high-value transactions
        if (tx.amount >= this.alertThreshold) {
          await this.sendHighValueAlert(tx);
        }
      }
    }
  }

  public async processTransaction(tx: Transaction): Promise<FinancialRecord | null> {
    const category = this.transactionMonitor.classifyTransaction(tx);
    const record: FinancialRecord = {
      transactionId: tx.id,
      date: new Date(tx.timestamp).toISOString().split('T')[0],
      category: category,
      amount: tx.type === 'expense' ? -tx.amount : tx.amount,
      description: tx.description,
      balanceAfter: this.totalIncome - this.totalExpense,
    };
    return record;
  }

  /**
   * Send transaction notification to Discord finance-alerts channel
   */
  private async sendTransactionAlert(tx: Transaction): Promise<void> {
    const isIncome = tx.type === 'income';
    const emoji = isIncome ? '💚' : '🔴';
    const typeLabel = isIncome ? 'รายรับ (Income)' : 'รายจ่าย (Expense)';
    const color = isIncome ? 0x2ecc71 : 0xe74c3c;

    await this.sendDiscordAlert({
      title: `${emoji} ${typeLabel}: ${tx.amount.toLocaleString()} ${tx.currency}`,
      color,
      fields: [
        { name: 'Transaction ID', value: tx.id.substring(0, 8), inline: true },
        { name: 'Amount', value: `${tx.amount.toLocaleString()} ${tx.currency}`, inline: true },
        { name: 'Type', value: tx.type, inline: true },
        { name: 'Description', value: tx.description, inline: false },
        { name: 'Source', value: tx.source, inline: true },
        { name: 'Status', value: tx.status, inline: true },
        { name: 'Time', value: new Date(tx.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), inline: true },
        { name: 'Running Balance', value: `${(this.totalIncome - this.totalExpense).toLocaleString()} THB`, inline: false },
      ],
    });
  }

  /**
   * Send high-value transaction alert
   */
  private async sendHighValueAlert(tx: Transaction): Promise<void> {
    await this.sendDiscordAlert({
      title: `🚨 HIGH VALUE ALERT: ${tx.amount.toLocaleString()} ${tx.currency}`,
      description: `Transaction exceeds threshold of ${this.alertThreshold.toLocaleString()} ${tx.currency}!`,
      color: 0xff0000,
      fields: [
        { name: 'Amount', value: `${tx.amount.toLocaleString()} ${tx.currency}`, inline: true },
        { name: 'Type', value: tx.type, inline: true },
        { name: 'Description', value: tx.description, inline: false },
      ],
    });
  }

  /**
   * Send daily financial summary to Discord
   */
  private async sendDailySummaryToDiscord(): Promise<void> {
    const summary = await this.generateFinancialSummary();
    const netColor = summary.netBalance >= 0 ? 0x2ecc71 : 0xe74c3c;

    await this.sendDiscordAlert({
      title: '📊 Daily Financial Summary',
      description: `Financial report for ${new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
      color: netColor,
      fields: [
        { name: '💚 Total Income', value: `${summary.totalIncome.toLocaleString()} THB`, inline: true },
        { name: '🔴 Total Expense', value: `${summary.totalExpense.toLocaleString()} THB`, inline: true },
        { name: '💵 Net Balance', value: `${summary.netBalance.toLocaleString()} THB`, inline: true },
        { name: '📝 Transactions Today', value: `${this.financialRecords.length}`, inline: true },
        { name: '📅 Period', value: summary.period, inline: true },
      ],
    });
  }

  /**
   * Send embed to Discord finance-alerts channel via Discord Bot HTTP API
   */
  private async sendDiscordAlert(embed: {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }): Promise<void> {
    if (!DISCORD_CHANNEL_FINANCE) {
      console.warn('Accountant Agent: DISCORD_CHANNEL_FINANCE_ALERTS not set');
      return;
    }

    try {
      await axios.post(`${DISCORD_BOT_URL}/alert/finance`, { embed }, { timeout: 5000 });
      console.log(`Accountant Agent: Sent alert to Discord: ${embed.title}`);
    } catch (error: any) {
      console.error(`Accountant Agent: Failed to send Discord alert: ${error.message}`);
      // Fallback: try direct send endpoint
      try {
        await axios.post(`${DISCORD_BOT_URL}/send`, {
          channelId: DISCORD_CHANNEL_FINANCE,
          embed,
        }, { timeout: 5000 });
      } catch (fallbackError: any) {
        console.error(`Accountant Agent: Fallback also failed: ${fallbackError.message}`);
      }
    }
  }

  public async sendAlert(tx: Transaction): Promise<void> {
    await this.sendTransactionAlert(tx);
  }

  public async generateFinancialSummary(): Promise<FinancialSummary> {
    const summary: FinancialSummary = {
      totalIncome: this.totalIncome,
      totalExpense: this.totalExpense,
      netBalance: this.totalIncome - this.totalExpense,
      period: 'daily',
      topExpenses: [],
      topIncomes: [],
    };
    return summary;
  }

  public async saveToMemory(record: FinancialRecord): Promise<void> {
    try {
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'accountant-agent',
        data: record,
        embedding: JSON.stringify(record),
        metadata: { type: 'financial_record', transactionId: record.transactionId, date: record.date },
      });
    } catch (error: any) {
      console.error(`Accountant Agent: Failed to save to memory: ${error.message}`);
    }
  }

  public async getTransactions(): Promise<Transaction[]> {
    return this.financialRecords.map(rec => ({
      id: rec.transactionId,
      amount: Math.abs(rec.amount),
      currency: 'THB',
      type: (rec.amount > 0 ? 'income' : 'expense') as 'income' | 'expense',
      description: rec.description,
      timestamp: new Date(rec.date).getTime(),
      source: 'unknown',
      status: 'completed' as const,
    }));
  }

  public async getSummary(): Promise<FinancialSummary> {
    return this.generateFinancialSummary();
  }

  public async testAlert(tx: Transaction): Promise<void> {
    await this.sendTransactionAlert(tx);
    if (tx.amount >= this.alertThreshold) {
      await this.sendHighValueAlert(tx);
    }
  }
}
