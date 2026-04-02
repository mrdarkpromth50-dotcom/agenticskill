import { Transaction } from './types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export class TransactionMonitor {
  private lastCheckedTimestamp: number = Date.now();
  private bankApiUrl: string;
  private paymentGatewayUrl: string;

  constructor(bankApiUrl: string, paymentGatewayUrl: string) {
    this.bankApiUrl = bankApiUrl;
    this.paymentGatewayUrl = paymentGatewayUrl;
  }

  public async startMonitoring(interval: number, callback: (transactions: Transaction[]) => Promise<void>): Promise<void> {
    setInterval(async () => {
      try {
        const newTransactions = await this.checkNewTransactions();
        if (newTransactions.length > 0) {
          await callback(newTransactions);
        }
      } catch (error) {
        console.error('Error during transaction monitoring:', error);
      }
    }, interval);
  }

  public async checkNewTransactions(): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    const currentTimestamp = Date.now();

    // Simulate fetching from Bank API
    try {
      // In a real scenario, this would be an actual API call
      // const bankResponse = await axios.get(`${this.bankApiUrl}/transactions?from=${this.lastCheckedTimestamp}`);
      // bankResponse.data.forEach((tx: any) => {
      //   transactions.push(this.parseBankTransaction(tx));
      // });
      console.log(`Simulating check for new bank transactions since ${new Date(this.lastCheckedTimestamp).toISOString()}`);
      // Example simulated transaction
      if (Math.random() < 0.2) { // 20% chance of new transaction
        transactions.push({
          id: uuidv4(),
          amount: parseFloat((Math.random() * 1000).toFixed(2)),
          currency: 'THB',
          type: Math.random() > 0.5 ? 'income' : 'expense',
          description: 'Simulated Bank Transaction',
          timestamp: currentTimestamp,
          source: 'bank',
          status: 'completed',
        });
      }
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
    }

    // Simulate fetching from Payment Gateway
    try {
      // const pgResponse = await axios.get(`${this.paymentGatewayUrl}/payments?from=${this.lastCheckedTimestamp}`);
      // pgResponse.data.forEach((tx: any) => {
      //   transactions.push(this.parsePaymentGatewayTransaction(tx));
      // });
      console.log(`Simulating check for new payment gateway transactions since ${new Date(this.lastCheckedTimestamp).toISOString()}`);
      // Example simulated transaction
      if (Math.random() < 0.1) { // 10% chance of new transaction
        transactions.push({
          id: uuidv4(),
          amount: parseFloat((Math.random() * 500).toFixed(2)),
          currency: 'THB',
          type: 'income',
          description: 'Simulated Payment Gateway Income',
          timestamp: currentTimestamp,
          source: 'payment_gateway',
          status: 'completed',
        });
      }
    } catch (error) {
      console.error('Error fetching payment gateway transactions:', error);
    }

    this.lastCheckedTimestamp = currentTimestamp;
    return transactions;
  }

  public classifyTransaction(transaction: Transaction): string {
    // Simple classification logic, can be expanded with LLM or rule-based system
    if (transaction.description.toLowerCase().includes('salary')) return 'Salary';
    if (transaction.description.toLowerCase().includes('rent')) return 'Rent';
    if (transaction.description.toLowerCase().includes('food')) return 'Food';
    if (transaction.description.toLowerCase().includes('software')) return 'Software Subscription';
    if (transaction.type === 'income') return 'Revenue';
    if (transaction.type === 'expense') return 'Operating Expense';
    return 'Miscellaneous';
  }

  // Placeholder for parsing logic from external APIs
  private parseBankTransaction(data: any): Transaction {
    // Implement actual parsing logic here
    return {
      id: data.id || uuidv4(),
      amount: data.amount,
      currency: data.currency || 'THB',
      type: data.type || 'expense',
      description: data.description || 'Bank Transaction',
      timestamp: data.timestamp || Date.now(),
      source: 'bank',
      status: data.status || 'completed',
    };
  }

  private parsePaymentGatewayTransaction(data: any): Transaction {
    // Implement actual parsing logic here
    return {
      id: data.id || uuidv4(),
      amount: data.amount,
      currency: data.currency || 'THB',
      type: data.type || 'income',
      description: data.description || 'Payment Gateway Transaction',
      timestamp: data.timestamp || Date.now(),
      source: 'payment_gateway',
      status: data.status || 'completed',
    };
  }
}
