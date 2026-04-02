export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  timestamp: number;
  source: string; // e.g., 'bank', 'paypal', 'stripe'
  status: 'pending' | 'completed' | 'failed';
}

export interface FinancialRecord {
  transactionId: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  balanceAfter: number;
}

export interface AlertConfig {
  threshold: number; // e.g., amount for a single transaction
  type: 'high_value_transaction' | 'unusual_activity';
  recipient: 'discord' | 'telegram';
  webhookUrl?: string;
  chatId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  period: string; // e.g., 'daily', 'weekly', 'monthly'
  topExpenses: { category: string; amount: number }[];
  topIncomes: { category: string; amount: number }[];
}
