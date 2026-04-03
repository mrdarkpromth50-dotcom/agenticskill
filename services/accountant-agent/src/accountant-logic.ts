import { TransactionMonitor } from './transaction-monitor';
import { Transaction, FinancialRecord, AlertConfig, FinancialSummary } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// Configuration
// ============================================================
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3014';
const DISCORD_CHANNEL_FINANCE = process.env.DISCORD_CHANNEL_FINANCE_ALERTS || '';
const BANK_API_URL = process.env.BANK_API_URL || 'http://mock-bank-api:8000';
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'http://mock-payment-gateway:8001';
const AGENT_ID = 'accountant-agent';

// Redis TTL constants (seconds)
const TTL_DAILY_SUMMARY = 86400;      // 24 hours
const TTL_RUNNING_TOTALS = 86400;     // 24 hours
const TTL_AGENT_STATUS = 300;         // 5 minutes

// ============================================================
// Memory HTTP Client Factory
// ============================================================
function createMemoryHttp() {
  const apiKey = (process.env.API_KEYS || '').split(',')[0] || '';
  return axios.create({
    baseURL: MEMORY_SYSTEM_URL,
    timeout: 8000,
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  });
}

// ============================================================
// AccountantAgent Class
// ============================================================
export class AccountantAgent {
  private transactionMonitor: TransactionMonitor;
  private financialRecords: FinancialRecord[] = [];
  private alertThreshold: number;
  private totalIncome: number = 0;
  private totalExpense: number = 0;
  private memoryHttp = createMemoryHttp();

  constructor() {
    this.transactionMonitor = new TransactionMonitor(BANK_API_URL, PAYMENT_GATEWAY_URL);
    this.alertThreshold = parseFloat(process.env.FINANCE_ALERT_THRESHOLD || '10000');
  }

  // ============================================================
  // Persistent Storage Helpers
  // ============================================================

  /** Simple hash-based embedding (128 dimensions) for ChromaDB */
  private generateSimpleEmbedding(text: string): number[] {
    const dim = 128;
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      const idx = (i * 7 + c * 13) % dim;
      vec[idx] = (vec[idx] + c / 255) % 1;
    }
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / mag);
  }

  /** Persist running totals to Redis (short-term) */
  private async persistRunningTotals(): Promise<void> {
    try {
      const data = JSON.stringify({
        totalIncome: this.totalIncome,
        totalExpense: this.totalExpense,
        netBalance: this.totalIncome - this.totalExpense,
        transactionCount: this.financialRecords.length,
        updatedAt: new Date().toISOString(),
      });
      await this.memoryHttp.post('/memory/short-term', {
        agentId: AGENT_ID,
        key: 'running_totals',
        value: data,
        ttl: TTL_RUNNING_TOTALS,
      });
    } catch (err: any) {
      console.warn(`[AccountantAgent] Failed to persist running totals: ${err.message}`);
    }
  }

  /** Restore running totals from Redis on startup */
  private async restoreRunningTotals(): Promise<void> {
    try {
      const response = await this.memoryHttp.get(`/memory/short-term/${AGENT_ID}/running_totals`);
      if (response?.data?.value) {
        const saved = JSON.parse(response.data.value);
        this.totalIncome = saved.totalIncome || 0;
        this.totalExpense = saved.totalExpense || 0;
        console.log(`[AccountantAgent] Restored from Redis: Income=${this.totalIncome}, Expense=${this.totalExpense}, Balance=${this.totalIncome - this.totalExpense}`);
      }
    } catch {
      console.log('[AccountantAgent] No previous totals found in Redis, starting fresh');
    }
  }

  /** Store financial record to ChromaDB (long-term memory) */
  public async saveToMemory(record: FinancialRecord): Promise<void> {
    try {
      // Build a descriptive document for vector search
      const document = `Financial Record: ${record.description}\n` +
        `Date: ${record.date}\n` +
        `Category: ${record.category}\n` +
        `Amount: ${record.amount} THB\n` +
        `Balance After: ${record.balanceAfter} THB\n` +
        `Transaction ID: ${record.transactionId}`;

      const embedding = this.generateSimpleEmbedding(document);

      await this.memoryHttp.post('/memory/long-term', {
        agentId: AGENT_ID,
        document,
        embedding,
        metadata: {
          type: 'financial_record',
          transactionId: record.transactionId,
          date: record.date,
          category: record.category,
          amount: record.amount,
          balanceAfter: record.balanceAfter,
        },
      });
      console.log(`[AccountantAgent] Saved financial record ${record.transactionId} to ChromaDB`);
    } catch (error: any) {
      console.error(`[AccountantAgent] Failed to save to ChromaDB: ${error.message}`);
    }
  }

  /** Persist daily summary to Redis */
  private async persistDailySummary(summary: FinancialSummary): Promise<void> {
    try {
      await this.memoryHttp.post('/memory/short-term', {
        agentId: AGENT_ID,
        key: `daily_summary:${new Date().toISOString().split('T')[0]}`,
        value: JSON.stringify(summary),
        ttl: TTL_DAILY_SUMMARY,
      });
      console.log('[AccountantAgent] Daily summary persisted to Redis');
    } catch (err: any) {
      console.warn(`[AccountantAgent] Failed to persist daily summary: ${err.message}`);
    }
  }

  /** Archive daily summary to ChromaDB (long-term) */
  private async archiveDailySummaryToChromaDB(summary: FinancialSummary): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const document = `Daily Financial Summary: ${date}\n` +
        `Total Income: ${summary.totalIncome} THB\n` +
        `Total Expense: ${summary.totalExpense} THB\n` +
        `Net Balance: ${summary.netBalance} THB\n` +
        `Period: ${summary.period}`;

      const embedding = this.generateSimpleEmbedding(document);

      await this.memoryHttp.post('/memory/long-term', {
        agentId: AGENT_ID,
        document,
        embedding,
        metadata: {
          type: 'daily_summary',
          date,
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netBalance: summary.netBalance,
        },
      });
      console.log('[AccountantAgent] Daily summary archived to ChromaDB');
    } catch (err: any) {
      console.warn(`[AccountantAgent] Failed to archive daily summary to ChromaDB: ${err.message}`);
    }
  }

  /** Publish financial activity to shared memory channel */
  private async publishActivity(activity: string): Promise<void> {
    try {
      await this.memoryHttp.post('/memory/shared/publish', {
        channel: 'finance-activities',
        message: JSON.stringify({
          agentId: AGENT_ID,
          activity,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Non-fatal
    }
  }

  /** Update agent status in shared state */
  private async updateSharedStatus(): Promise<void> {
    try {
      await this.memoryHttp.post('/memory/shared/accountant-status', {
        value: JSON.stringify({
          totalIncome: this.totalIncome,
          totalExpense: this.totalExpense,
          netBalance: this.totalIncome - this.totalExpense,
          transactionCount: this.financialRecords.length,
          alertThreshold: this.alertThreshold,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch {
      // Non-fatal
    }
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  public async start(): Promise<void> {
    console.log('Accountant Agent: Starting financial monitoring...');

    // Restore running totals from Redis
    await this.restoreRunningTotals();
    await this.updateSharedStatus();

    const monitoringInterval = parseInt(process.env.TRANSACTION_MONITOR_INTERVAL || '60000');
    this.transactionMonitor.startMonitoring(monitoringInterval, this.handleNewTransactions.bind(this));

    // Send startup notification to Discord
    await this.sendDiscordAlert({
      title: '💰 Accountant Agent Online',
      description: `Financial monitoring system is active. Restored: Income=${this.totalIncome.toLocaleString()} THB, Expense=${this.totalExpense.toLocaleString()} THB`,
      color: 0x2ecc71,
      fields: [
        { name: 'Alert Threshold', value: `${this.alertThreshold} THB`, inline: true },
        { name: 'Monitor Interval', value: `${monitoringInterval / 1000}s`, inline: true },
        { name: 'Status', value: '✅ Active', inline: true },
        { name: 'Restored Income', value: `${this.totalIncome.toLocaleString()} THB`, inline: true },
        { name: 'Restored Expense', value: `${this.totalExpense.toLocaleString()} THB`, inline: true },
        { name: 'Net Balance', value: `${(this.totalIncome - this.totalExpense).toLocaleString()} THB`, inline: true },
      ],
    });

    await this.publishActivity('Accountant Agent started');

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

  // ============================================================
  // Transaction Processing
  // ============================================================

  private async handleNewTransactions(transactions: Transaction[]): Promise<void> {
    for (const tx of transactions) {
      console.log(`Accountant Agent: Processing transaction: ${tx.id} - ${tx.amount} ${tx.currency} (${tx.type})`);
      const record = await this.processTransaction(tx);
      if (record) {
        this.financialRecords.push(record);

        // Save to ChromaDB (long-term memory)
        await this.saveToMemory(record);

        // Track totals
        if (tx.type === 'income') {
          this.totalIncome += tx.amount;
        } else {
          this.totalExpense += tx.amount;
        }

        // Persist running totals to Redis
        await this.persistRunningTotals();
        await this.updateSharedStatus();

        // Publish activity
        await this.publishActivity(`Transaction processed: ${tx.type} ${tx.amount} THB - ${tx.description}`);

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

  // ============================================================
  // Discord Alerts
  // ============================================================

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

  private async sendDailySummaryToDiscord(): Promise<void> {
    const summary = await this.generateFinancialSummary();
    const netColor = summary.netBalance >= 0 ? 0x2ecc71 : 0xe74c3c;

    // Persist and archive the daily summary
    await this.persistDailySummary(summary);
    await this.archiveDailySummaryToChromaDB(summary);
    await this.publishActivity(`Daily summary sent: Net Balance=${summary.netBalance} THB`);

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

  // ============================================================
  // Public API
  // ============================================================

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
