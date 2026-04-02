export interface LLMAccount {
  id: string;
  type: 'gemini' | 'opus' | 'openai'; // Type of LLM provider
  apiKey?: string; // API Key for the LLM service
  email?: string; // Email for Google/Gmail accounts
  password?: string; // Password for Google/Gmail accounts (consider secure storage)
  // Add other relevant credentials or configurations
}

export interface LLMAccountStatus extends LLMAccount {
  lastUsed: number; // Timestamp of last usage
  usageCount: number; // Number of times this account has been used
  health: 'healthy' | 'unhealthy' | 'unknown';
  healthMessage?: string;
}
