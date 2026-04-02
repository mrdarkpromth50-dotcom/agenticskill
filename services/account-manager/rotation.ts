import { LLMAccount, LLMAccountStatus } from './types';

const ACCOUNT_ROTATION_INTERVAL = parseInt(process.env.ACCOUNT_ROTATION_INTERVAL || '60000', 10); // 1 minute

export class AccountManager {
  private accounts: Map<string, LLMAccountStatus> = new Map();
  private rotationIndex: number = 0;
  private availableAccountIds: string[] = [];

  constructor(initialAccounts: LLMAccount[]) {
    initialAccounts.forEach(account => {
      this.accounts.set(account.id, { ...account, lastUsed: 0, usageCount: 0, health: 'unknown' });
      this.availableAccountIds.push(account.id);
    });
    console.log(`AccountManager: Initialized with ${this.accounts.size} accounts.`);
  }

  addAccount(account: LLMAccount): void {
    if (!this.accounts.has(account.id)) {
      this.accounts.set(account.id, { ...account, lastUsed: 0, usageCount: 0, health: 'unknown' });
      this.availableAccountIds.push(account.id);
      console.log(`AccountManager: Added new account: ${account.id}`);
    } else {
      console.warn(`AccountManager: Account ${account.id} already exists.`);
    }
  }

  getAccount(id: string): LLMAccountStatus | undefined {
    return this.accounts.get(id);
  }

  getHealthyAccounts(): LLMAccountStatus[] {
    return Array.from(this.accounts.values()).filter(acc => acc.health === 'healthy');
  }

  getNextAvailableAccount(): LLMAccountStatus | undefined {
    const healthyAccounts = this.getHealthyAccounts();
    if (healthyAccounts.length === 0) {
      console.warn('AccountManager: No healthy accounts available for rotation.');
      return undefined;
    }

    // Simple round-robin rotation among healthy accounts
    const nextAccount = healthyAccounts[this.rotationIndex % healthyAccounts.length];
    this.rotationIndex++;

    if (nextAccount) {
      nextAccount.lastUsed = Date.now();
      nextAccount.usageCount++;
      console.log(`AccountManager: Rotating to account: ${nextAccount.id}. Total usage: ${nextAccount.usageCount}`);
    }
    return nextAccount;
  }

  updateAccountHealth(id: string, health: 'healthy' | 'unhealthy' | 'unknown', message?: string): void {
    const account = this.accounts.get(id);
    if (account) {
      account.health = health;
      if (message) {
        account.healthMessage = message;
      }
      console.log(`AccountManager: Updated health for ${id} to ${health}. Message: ${message || 'N/A'}`);
    }
  }

  getAllAccountStatuses(): LLMAccountStatus[] {
    return Array.from(this.accounts.values());
  }

  // Optional: Start a background process to periodically rotate accounts or check usage
  startRotationLoop(): void {
    setInterval(() => {
      // This loop could trigger a re-evaluation of account availability or load balancing
      console.log('AccountManager: Performing periodic account rotation check.');
      this.getNextAvailableAccount(); // Just to advance the index and log
    }, ACCOUNT_ROTATION_INTERVAL);
  }
}
