import { LLMProviderConfig, LLMProviderType, LoadBalancingStrategy } from './types';
import { v4 as uuidv4 } from 'uuid';

export class ProviderManager {
  private providers: Map<string, LLMProviderConfig> = new Map();

  constructor() {
    this.loadProvidersFromEnv();
  }

  private loadProvidersFromEnv() {
    // Example: LLM_PROVIDERS="gemini:gemini-pro:key1,openai:gpt-4:key2"
    const llmProvidersEnv = process.env.LLM_PROVIDERS;
    if (llmProvidersEnv) {
      llmProvidersEnv.split(',').forEach(providerStr => {
        const [type, model, apiKey, baseUrl, priorityStr] = providerStr.split(':');
        if (type && model && apiKey) {
          const priority = priorityStr ? parseInt(priorityStr, 10) : 10;
          this.registerProvider({
            id: uuidv4(),
            type: type as LLMProviderType,
            name: `${type}-${model}`,
            apiKey,
            baseUrl: baseUrl || undefined,
            model,
            healthStatus: 'healthy',
            lastChecked: Date.now(),
            unhealthyUntil: 0,
            priority,
            usageCount: 0,
          });
        }
      });
    }
  }

  public registerProvider(config: LLMProviderConfig): void {
    if (this.providers.has(config.id)) {
      console.warn(`Provider with ID ${config.id} already registered. Updating existing provider.`);
    }
    this.providers.set(config.id, { ...config, usageCount: 0, healthStatus: 'healthy', unhealthyUntil: 0, lastChecked: Date.now() });
    console.log(`Registered LLM Provider: ${config.name} (${config.type})`);
  }

  public getProvider(strategy: LoadBalancingStrategy = 'round-robin'): LLMProviderConfig | undefined {
    const healthyProviders = this.getHealthyProviders();
    if (healthyProviders.length === 0) {
      console.warn('No healthy LLM providers available.');
      return undefined;
    }

    switch (strategy) {
      case 'round-robin':
        // Simple round-robin based on usageCount
        healthyProviders.sort((a, b) => a.usageCount - b.usageCount);
        const selectedProviderRR = healthyProviders[0];
        if (selectedProviderRR) {
          selectedProviderRR.usageCount++;
        }
        return selectedProviderRR;
      case 'least-used':
        healthyProviders.sort((a, b) => a.usageCount - b.usageCount);
        const selectedProviderLU = healthyProviders[0];
        if (selectedProviderLU) {
          selectedProviderLU.usageCount++;
        }
        return selectedProviderLU;
      case 'weighted-round-robin':
        // Not fully implemented, falls back to round-robin for now
        console.warn('Weighted Round Robin not fully implemented, falling back to Round Robin.');
        healthyProviders.sort((a, b) => a.usageCount - b.usageCount);
        const selectedProviderWRR = healthyProviders[0];
        if (selectedProviderWRR) {
          selectedProviderWRR.usageCount++;
        }
        return selectedProviderWRR;
      case 'random':
        const selectedProviderRand = healthyProviders[Math.floor(Math.random() * healthyProviders.length)];
        if (selectedProviderRand) {
          selectedProviderRand.usageCount++;
        }
        return selectedProviderRand;
      default:
        console.warn(`Unknown load balancing strategy: ${strategy}. Falling back to round-robin.`);
        healthyProviders.sort((a, b) => a.usageCount - b.usageCount);
        const selectedProviderDefault = healthyProviders[0];
        if (selectedProviderDefault) {
          selectedProviderDefault.usageCount++;
        }
        return selectedProviderDefault;
    }
  }

  public getProviderById(id: string): LLMProviderConfig | undefined {
    return this.providers.get(id);
  }

  public markProviderUnhealthy(id: string, durationMs: number): void {
    const provider = this.providers.get(id);
    if (provider) {
      provider.healthStatus = 'unhealthy';
      provider.unhealthyUntil = Date.now() + durationMs;
      console.warn(`Provider ${provider.name} marked unhealthy until ${new Date(provider.unhealthyUntil).toLocaleString()}`);
    }
  }

  public getHealthyProviders(): LLMProviderConfig[] {
    const now = Date.now();
    return Array.from(this.providers.values()).filter(provider => {
      if (provider.healthStatus === 'unhealthy' && provider.unhealthyUntil <= now) {
        provider.healthStatus = 'healthy'; // Auto-heal after duration
        console.log(`Provider ${provider.name} is now healthy again.`);
      }
      return provider.healthStatus === 'healthy';
    });
  }

  public getAllProviders(): LLMProviderConfig[] {
    return Array.from(this.providers.values());
  }

  public resetUsageCounts(): void {
    this.providers.forEach(provider => provider.usageCount = 0);
  }
}
