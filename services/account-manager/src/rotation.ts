import { Account, AccountStats } from './types';

export class AccountRotation {
  private accounts: Map<string, Account> = new Map();
  private roundRobinIndex: number = -1;

  constructor(initialAccounts: Account[] = []) {
    console.log("AccountRotation initialized.");
    initialAccounts.forEach(acc => this.addAccount(acc));
  }

  addAccount(account: Omit<Account, 'usageCount' | 'lastUsed'>): Account {
    if (this.accounts.has(account.id)) {
      console.warn(`Account with ID ${account.id} already exists. Updating it.`);
    }
    const newAccount: Account = {
      ...account,
      usageCount: 0,
      lastUsed: 0,
    };
    this.accounts.set(account.id, newAccount);
    console.log(`Account added/updated: ${account.id} (Type: ${account.type})`);
    return newAccount;
  }

  removeAccount(accountId: string): boolean {
    const deleted = this.accounts.delete(accountId);
    if (deleted) {
      console.log(`Account removed: ${accountId}`);
    }
    return deleted;
  }

  getNextAccount(type?: string): Account | undefined {
    const availableAccounts = this.getAvailableAccounts(type);
    if (availableAccounts.length === 0) {
      console.warn(`No available accounts of type '${type || 'any'}' found.`);
      return undefined;
    }

    // Round-robin strategy
    this.roundRobinIndex = (this.roundRobinIndex + 1) % availableAccounts.length;
    const account = availableAccounts[this.roundRobinIndex];
    
    this.markAccountAsUsed(account.id);
    return account;
  }

  getLeastUsedAccount(type?: string): Account | undefined {
    const availableAccounts = this.getAvailableAccounts(type);
    if (availableAccounts.length === 0) {
      console.warn(`No available accounts of type '${type || 'any'}' found.`);
      return undefined;
    }

    const leastUsedAccount = availableAccounts.reduce((prev, curr) => 
      (prev.usageCount < curr.usageCount) ? prev : curr
    );

    this.markAccountAsUsed(leastUsedAccount.id);
    return leastUsedAccount;
  }

  markAccountRateLimited(accountId: string, durationMs: number): boolean {
    const account = this.accounts.get(accountId);
    if (account) {
      account.rateLimitedUntil = Date.now() + durationMs;
      console.log(`Account ${accountId} marked as rate-limited for ${durationMs / 1000}s.`);
      return true;
    }
    return false;
  }

  isAccountAvailable(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;
    
    const isRateLimited = account.rateLimitedUntil && account.rateLimitedUntil > Date.now();
    return !isRateLimited;
  }

  getAccountStats(): AccountStats[] {
    return Array.from(this.accounts.values()).map(acc => this.getStatsForAccount(acc.id)!);
  }

  getStatsForAccount(accountId: string): AccountStats | undefined {
      const acc = this.accounts.get(accountId);
      if (!acc) return undefined;
      return {
        id: acc.id,
        type: acc.type,
        usageCount: acc.usageCount,
        lastUsed: acc.lastUsed,
        isAvailable: this.isAccountAvailable(acc.id),
        rateLimitedUntil: acc.rateLimitedUntil
      };
  }

  private getAvailableAccounts(type?: string): Account[] {
      return Array.from(this.accounts.values()).filter(acc => 
          this.isAccountAvailable(acc.id) && (!type || acc.type === type)
      );
  }

  private markAccountAsUsed(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.usageCount++;
      account.lastUsed = Date.now();
    }
  }
}
