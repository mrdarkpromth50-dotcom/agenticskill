import { LLMAccount, LoadBalancingStrategy } from './types';
import { v4 as uuidv4 } from 'uuid';

export class AccountPool {
  private accounts: Map<string, LLMAccount> = new Map();
  private lastUsedIndex: number = -1;

  constructor() {
    this.loadAccountsFromEnv();
  }

  private loadAccountsFromEnv() {
    // Example: GOOGLE_ACCOUNTS="providerId1:credentials1,providerId2:credentials2"
    const googleAccountsEnv = process.env.GOOGLE_ACCOUNTS;
    if (googleAccountsEnv) {
      googleAccountsEnv.split(',').forEach(accountStr => {
        const [providerId, credentials] = accountStr.split(':');
        if (providerId && credentials) {
          this.addAccount({
            id: uuidv4(),
            providerId,
            credentials: { key: credentials }, // Assuming credentials is a simple key for now
            usageCount: 0,
            lastUsed: 0,
            isRateLimited: false,
            rateLimitedUntil: 0,
            healthStatus: 'healthy',
          });
        }
      });
    }
  }

  public addAccount(account: LLMAccount): void {
    if (this.accounts.has(account.id)) {
      console.warn(`Account with ID ${account.id} already exists. Updating existing account.`);
    }
    this.accounts.set(account.id, { ...account, usageCount: 0, lastUsed: 0, isRateLimited: false, rateLimitedUntil: 0, healthStatus: 'healthy' });
    console.log(`Added LLM Account: ${account.id} for provider ${account.providerId}`);
  }

  public getNextAccount(strategy: LoadBalancingStrategy = 'round-robin'): LLMAccount | undefined {
    const availableAccounts = this.getAvailableAccounts();
    if (availableAccounts.length === 0) {
      console.warn('No available LLM accounts found.');
      return undefined;
    }

    let selectedAccount: LLMAccount | undefined;

    switch (strategy) {
      case 'round-robin':
        this.lastUsedIndex = (this.lastUsedIndex + 1) % availableAccounts.length;
        selectedAccount = availableAccounts[this.lastUsedIndex];
        break;
      case 'least-used':
        availableAccounts.sort((a, b) => a.usageCount - b.usageCount);
        selectedAccount = availableAccounts[0];
        break;
      case 'weighted-round-robin':
        // Not fully implemented, falls back to round-robin for now
        console.warn('Weighted Round Robin not fully implemented for accounts, falling back to Round Robin.');
        this.lastUsedIndex = (this.lastUsedIndex + 1) % availableAccounts.length;
        selectedAccount = availableAccounts[this.lastUsedIndex];
        break;
      case 'random':
        selectedAccount = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];
        break;
      default:
        console.warn(`Unknown account load balancing strategy: ${strategy}. Falling back to round-robin.`);
        this.lastUsedIndex = (this.lastUsedIndex + 1) % availableAccounts.length;
        selectedAccount = availableAccounts[this.lastUsedIndex];
        break;
    }

    if (selectedAccount) {
      selectedAccount.usageCount++;
      selectedAccount.lastUsed = Date.now();
    }
    return selectedAccount;
  }

  public markRateLimited(accountId: string, durationMs: number): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.isRateLimited = true;
      account.rateLimitedUntil = Date.now() + durationMs;
      account.healthStatus = 'unhealthy';
      console.warn(`Account ${accountId} marked as rate-limited until ${new Date(account.rateLimitedUntil).toLocaleString()}`);
    }
  }

  public getAvailableAccounts(): LLMAccount[] {
    const now = Date.now();
    return Array.from(this.accounts.values()).filter(account => {
      if (account.isRateLimited && account.rateLimitedUntil <= now) {
        account.isRateLimited = false;
        account.healthStatus = 'healthy';
        console.log(`Account ${account.id} is no longer rate-limited.`);
      }
      return account.healthStatus === 'healthy';
    });
  }

  public getAccountStats(): LLMAccount[] {
    return Array.from(this.accounts.values());
  }

  public getAccountById(id: string): LLMAccount | undefined {
    return this.accounts.get(id);
  }

  public resetUsageCounts(): void {
    this.accounts.forEach(account => account.usageCount = 0);
  }
}
