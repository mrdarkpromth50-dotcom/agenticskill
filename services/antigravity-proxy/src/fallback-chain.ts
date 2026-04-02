type LLMProviderType = string;
import { LLMProviderConfig, LLMRequest, LLMResponse, ChatRequest, ChatResponse, FallbackStrategy } from './types';
import { ProviderManager } from './provider-manager';
import { AccountPool } from './account-pool';
import axios, { AxiosError } from 'axios';

export class FallbackChain {
  private providerManager: ProviderManager;
  private accountPool: AccountPool;
  private maxRetries: number;
  private initialRetryDelay: number; // in ms

  constructor(providerManager: ProviderManager, accountPool: AccountPool) {
    this.providerManager = providerManager;
    this.accountPool = accountPool;
    this.maxRetries = parseInt(process.env.FALLBACK_MAX_RETRIES || '3', 10);
    this.initialRetryDelay = parseInt(process.env.FALLBACK_INITIAL_RETRY_DELAY || '1000', 10);
  }

  private async callProvider(provider: LLMProviderConfig, request: LLMRequest | ChatRequest, isChat: boolean): Promise<LLMResponse | ChatResponse> {
    const account = this.accountPool.getNextAccount('round-robin'); // Always try to get an account
    if (!account) {
      throw new Error('No available LLM accounts for the provider.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey || account.credentials.key}`,
      // Add other provider-specific headers if needed
    };

    const url = provider.baseUrl || this.getProviderDefaultUrl(provider.type);
    if (!url) {
      throw new Error(`Base URL not configured for provider type: ${provider.type}`);
    }

    try {
      let response;
      if (isChat) {
        const chatRequest = request as ChatRequest;
        response = await axios.post(`${url}/chat/completions`, {
          model: provider.model,
          messages: chatRequest.messages,
          max_tokens: chatRequest.maxTokens || provider.maxTokens,
          temperature: chatRequest.temperature || provider.temperature,
          stream: chatRequest.stream,
        }, { headers });
        return { // Simplified mapping
          id: response.data.id || 'chat-response-' + Date.now(),
          message: response.data.choices[0].message,
          finishReason: response.data.choices[0].finish_reason,
          usage: response.data.usage,
        };
      } else {
        const llmRequest = request as LLMRequest;
        response = await axios.post(`${url}/completions`, {
          model: provider.model,
          prompt: llmRequest.prompt,
          max_tokens: llmRequest.maxTokens || provider.maxTokens,
          temperature: llmRequest.temperature || provider.temperature,
          stream: llmRequest.stream,
        }, { headers });
        return { // Simplified mapping
          id: response.data.id || 'llm-response-' + Date.now(),
          text: response.data.choices[0].text,
          finishReason: response.data.choices[0].finish_reason,
          usage: response.data.usage,
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 429) {
          console.warn(`Provider ${provider.name} (Account ${account.id}) hit rate limit. Marking as rate-limited.`);
          this.accountPool.markRateLimited(account.id, 60 * 1000); // Mark for 1 minute
        }
        throw new Error(`LLM Provider Error (${provider.name}): ${error.response.status} - ${error.response.data.message || error.message}`);
      } else {
        throw new Error(`LLM Provider Error (${provider.name}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private getProviderDefaultUrl(type: LLMProviderType): string | undefined {
    switch (type) {
      case 'gemini': return 'https://generativelanguage.googleapis.com/v1beta';
      case 'openai': return 'https://api.openai.com/v1';
      case 'ollama': return 'http://ollama:11434/api'; // Assuming ollama service name in docker-compose
      case 'custom': return undefined;
      default: return undefined;
    }
  }

  public async execute(request: LLMRequest | ChatRequest, isChat: boolean = false): Promise<LLMResponse | ChatResponse> {
    const primaryProviderId = process.env.PRIMARY_PROVIDER;
    const fallbackProviderIds = (process.env.FALLBACK_PROVIDERS || '').split(',').filter(Boolean);

    const allProviders = this.providerManager.getAllProviders();
    const sortedProviders = allProviders.sort((a, b) => a.priority - b.priority);

    let providersToTry: LLMProviderConfig[] = [];

    // Add primary provider first if specified and healthy
    if (primaryProviderId) {
      const primary = sortedProviders.find(p => p.id === primaryProviderId && p.healthStatus === 'healthy');
      if (primary) providersToTry.push(primary);
    }

    // Add other healthy providers based on priority or fallback strategy
    const fallbackStrategy: FallbackStrategy = (process.env.FALLBACK_STRATEGY as FallbackStrategy) || 'priority';

    let otherHealthyProviders = sortedProviders.filter(p => p.healthStatus === 'healthy' && p.id !== primaryProviderId);

    if (fallbackStrategy === 'random') {
      otherHealthyProviders = otherHealthyProviders.sort(() => 0.5 - Math.random()); // Shuffle for random fallback
    }

    providersToTry = [...providersToTry, ...otherHealthyProviders];

    if (providersToTry.length === 0) {
      throw new Error('No healthy LLM providers available to execute the request.');
    }

    let lastError: Error | undefined;

    for (const provider of providersToTry) {
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          console.log(`Attempting to call LLM provider: ${provider.name} (Attempt ${attempt + 1}/${this.maxRetries})`);
          const response = await this.callProvider(provider, request, isChat);
          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`Error with provider ${provider.name} on attempt ${attempt + 1}: ${lastError.message}`);

          // If it's a rate limit error, mark provider/account unhealthy and break retry loop for this provider
          if (lastError.message.includes('rate limit')) {
            this.providerManager.markProviderUnhealthy(provider.id, 5 * 60 * 1000); // Mark unhealthy for 5 minutes
            break; // Move to next provider immediately
          }

          // Exponential backoff for other errors
          const delay = this.initialRetryDelay * Math.pow(2, attempt);
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw new Error(`All LLM providers failed after multiple retries. Last error: ${lastError?.message || 'Unknown error'}`);
  }
}
