import { LLMProviderConfig, LoadBalancingStrategy } from './types';
import { ProviderManager } from './provider-manager';

export class LoadBalancer {
  private providerManager: ProviderManager;
  private strategy: LoadBalancingStrategy;

  constructor(providerManager: ProviderManager, strategy: LoadBalancingStrategy = 'round-robin') {
    this.providerManager = providerManager;
    this.strategy = strategy;
  }

  public selectProvider(): LLMProviderConfig | undefined {
    return this.providerManager.getProvider(this.strategy);
  }

  public setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
  }

  public trackUsage(providerId: string): void {
    const provider = this.providerManager.getProviderById(providerId);
    if (provider) {
      provider.usageCount++;
    }
  }
}
