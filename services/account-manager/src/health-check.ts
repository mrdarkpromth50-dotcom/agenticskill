import { AccountRotation } from './rotation';
import { Account } from './types';

export class HealthCheck {
  private rotation: AccountRotation;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(rotation: AccountRotation) {
    this.rotation = rotation;
    console.log("HealthCheck initialized.");
  }

  async checkAccount(account: Account): Promise<boolean> {
    console.log(`Checking health for account: ${account.id} (${account.type})`);
    try {
      // Simulate health check (e.g., calling OpenAI's models list endpoint)
      const isHealthy = Math.random() > 0.05; // 95% success rate
      if (!isHealthy) {
        console.warn(`Account ${account.id} failed health check.`);
        this.rotation.markAccountRateLimited(account.id, 300000); // 5 minutes
      }
      return isHealthy;
    } catch (error) {
      console.error(`Error checking health for account ${account.id}:`, error);
      return false;
    }
  }

  async checkAllAccounts(): Promise<void> {
    console.log("Starting health check for all accounts...");
    const accounts = this.rotation.getAccountStats();
    for (const accStats of accounts) {
        // In a real scenario, we'd get the full account object from rotation
        // For simulation, we just use the ID
        const isHealthy = Math.random() > 0.05;
        if (!isHealthy) {
            this.rotation.markAccountRateLimited(accStats.id, 300000);
        }
    }
    console.log("Finished health check for all accounts.");
  }

  startPeriodicCheck(intervalMs: number = 300000): void {
    if (this.checkInterval) {
      console.warn("Periodic health check is already running.");
      return;
    }
    console.log(`Starting periodic health check every ${intervalMs / 1000} seconds.`);
    this.checkInterval = setInterval(() => this.checkAllAccounts(), intervalMs);
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("Periodic health check stopped.");
    }
  }
}
