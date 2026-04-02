export interface Account {
  id: string;
  type: string; // e.g., "openai", "anthropic", "google"
  apiKey: string;
  usageCount: number;
  lastUsed: number; // timestamp
  rateLimitedUntil?: number; // timestamp
}

export interface AccountStats {
  id: string;
  type: string;
  usageCount: number;
  lastUsed: number;
  isAvailable: boolean;
  rateLimitedUntil?: number;
}
