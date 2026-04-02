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

export interface MemoryRecord {
  id: string;
  document: string;
  metadata: Record<string, any>;
  embedding?: number[];
  timestamp: number;
}

export interface SharedMemoryMessage {
  channel: string;
  message: string;
  timestamp: number;
  senderId?: string;
}

export interface SharedMemoryState {
  key: string;
  value: string;
  timestamp: number;
  lastUpdatedBy?: string;
}
