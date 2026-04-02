export interface ShortTermMemoryStoreRequest {
  agentId: string;
  key: string;
  value: string;
  ttl?: number;
}

export interface LongTermMemoryStoreRequest {
  agentId: string;
  document: string;
  // Embedding generation is handled by the caller or another service
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface LongTermMemorySearchRequest {
  agentId: string;
  queryEmbedding: number[];
  nResults?: number;
  where?: Record<string, any>;
}

export interface SearchResult {
  document: any;
  id: string;
  metadata: any;
  distance: number;
}
