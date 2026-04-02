import { TransactionMonitor } from './transaction-monitor';
import { Transaction, FinancialRecord, AlertConfig, FinancialSummary } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';
const FINANCE_DISCORD_WEBHOOK_URL = process.env.FINANCE_DISCORD_WEBHOOK_URL;
const BANK_API_URL = process.env.BANK_API_URL || 'http://mock-bank-api:8000';
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'http://mock-payment-gateway:8001';

export class AccountantAgent {
  private transactionMonitor: TransactionMonitor;
  private financialRecords: FinancialRecord[] = []; // In-memory for current session, will be saved to long-term
  private alertThreshold: number;

  constructor() {
    this.transactionMonitor = new TransactionMonitor(BANK_API_URL, PAYMENT_GATEWAY_URL);
    this.alertThreshold = parseFloat(process.env.FINANCE_ALERT_THRESHOLD || '10000'); // Default to 10,000
  }

  public async start(): Promise<void> {
    console.log('Accountant Agent: Starting financial monitoring...');
    const monitoringInterval = parseInt(process.env.TRANSACTION_MONITOR_INTERVAL || '60000'); // Default 1 minute
    this.transactionMonitor.startMonitoring(monitoringInterval, this.handleNewTransactions.bind(this));

    // Start daily summary generation (e.g., at midnight)
    // In a real app, use node-cron for scheduling
    setInterval(() => this.generateFinancialSummary(), 24 * 60 * 60 * 1000); // Every 24 hours for simulation
  }

  private async handleNewTransactions(transactions: Transaction[]): Promise<void> {
    for (const tx of transactions) {
      console.log(`Accountant Agent: Processing new transaction: ${tx.id} - ${tx.amount} ${tx.currency}`);
      const record = await this.processTransaction(tx);
      if (record) {
        this.financialRecords.push(record);
        await this.saveToMemory(record);
        if (tx.amount >= this.alertThreshold) {
          await this.sendAlert(tx);
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
      balanceAfter: 0, // This would require fetching current balance from a ledger
    };
    return record;
  }

  public async sendAlert(tx: Transaction): Promise<void> {
    if (!FINANCE_DISCORD_WEBHOOK_URL) {
      console.warn('FINANCE_DISCORD_WEBHOOK_URL is not set. Cannot send Discord alerts.');
      return;
    }

    const alertMessage = {
      content: `🚨 **Financial Alert: High Value Transaction Detected!** 🚨\n` +
               `**Transaction ID:** ${tx.id}\n` +
               `**Amount:** ${tx.amount} ${tx.currency}\n` +
               `**Type:** ${tx.type}\n` +
               `**Description:** ${tx.description}\n` +
               `**Source:** ${tx.source}\n` +
               `**Timestamp:** ${new Date(tx.timestamp).toLocaleString()}`,
    };

    try {
      await axios.post(FINANCE_DISCORD_WEBHOOK_URL, alertMessage);
      console.log(`Accountant Agent: Sent high-value transaction alert for ${tx.id} to Discord.`);
    } catch (error) {
      console.error('Accountant Agent: Failed to send Discord alert:', error);
    }
  }

  public async generateFinancialSummary(): Promise<FinancialSummary> {
    console.log('Accountant Agent: Generating daily financial summary...');
    // In a real scenario, this would query the Memory System for all relevant records
    // For now, use in-memory records
    const summary: FinancialSummary = {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      period: 'daily',
      topExpenses: [],
      topIncomes: [],
    };

    this.financialRecords.forEach(record => {
      if (record.amount > 0) {
        summary.totalIncome += record.amount;
      } else {
        summary.totalExpense += Math.abs(record.amount);
      }
    });
    summary.netBalance = summary.totalIncome - summary.totalExpense;

    // Placeholder for top expenses/incomes logic
    console.log('Accountant Agent: Financial Summary Generated:', summary);
    return summary;
  }

  public async saveToMemory(record: FinancialRecord): Promise<void> {
    try {
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'accountant-agent',
        data: record,
        embedding: JSON.stringify(record), // Simple embedding for now, ideally use a proper embedding model
        metadata: { type: 'financial_record', transactionId: record.transactionId, date: record.date },
      });
      console.log(`Accountant Agent: Saved financial record ${record.transactionId} to long-term memory.`);
    } catch (error) {
      console.error(`Accountant Agent: Failed to save financial record ${record.transactionId} to memory:`, error);
    }
  }

  public async getTransactions(): Promise<Transaction[]> {
    // In a real scenario, fetch from Memory System
    return this.financialRecords.map(rec => ({
      id: rec.transactionId,
      amount: Math.abs(rec.amount),
      currency: 'THB',
      type: rec.amount > 0 ? 'income' : 'expense',
      description: rec.description,
      timestamp: new Date(rec.date).getTime(),
      source: 'unknown',
      status: 'completed',
    }));
  }

  public async getSummary(): Promise<FinancialSummary> {
    return this.generateFinancialSummary();
  }

  public async testAlert(tx: Transaction): Promise<void> {
    await this.sendAlert(tx);
  }
}
