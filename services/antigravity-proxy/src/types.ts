export type LLMProviderType = 'gemini' | 'openai' | 'ollama' | 'custom';

export interface LLMProviderConfig {
  id: string;
  type: LLMProviderType;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  healthStatus: 'healthy' | 'unhealthy';
  lastChecked: number;
  unhealthyUntil: number;
  priority: number; // Lower number means higher priority
  usageCount: number;
}

export interface LLMAccount {
  id: string;
  providerId: string; // Which provider this account belongs to
  credentials: any; // e.g., Google Service Account key, OpenAI API key
  usageCount: number;
  lastUsed: number;
  isRateLimited: boolean;
  rateLimitedUntil: number;
  healthStatus: 'healthy' | 'unhealthy';
}

export interface LLMRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  // Add other common LLM request parameters
}

export interface LLMResponse {
  id: string;
  text: string;
  finishReason: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number; };
  // Add other common LLM response parameters
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  message: ChatMessage;
  finishReason: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number; };
}

export type LoadBalancingStrategy = 'round-robin' | 'least-used' | 'weighted-round-robin' | 'random';

export type FallbackStrategy = 'priority' | 'random';
