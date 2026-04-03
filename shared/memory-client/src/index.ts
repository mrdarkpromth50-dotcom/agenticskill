/**
 * @agenticskill/memory-client
 * Shared Memory Client for all AgenticSkill agents
 * Provides a unified interface for interacting with the Memory System Service
 * (Redis for short-term/shared memory, ChromaDB for long-term vector memory)
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================
// Types
// ============================================================

export interface ShortTermMemoryOptions {
  agentId: string;
  key: string;
  value: string;
  ttl?: number; // seconds
}

export interface LongTermMemoryOptions {
  agentId: string;
  document: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface LongTermSearchOptions {
  agentId: string;
  queryEmbedding: number[];
  nResults?: number;
  where?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  document: string;
  metadata: Record<string, any>;
  distance: number;
}

export interface SharedStateOptions {
  key: string;
  value: any;
}

export interface PubSubOptions {
  channel: string;
  message: string;
}

export interface AdvancedSearchOptions {
  agentId?: string;
  query?: string;
  startTime?: string;
  endTime?: string;
  searchType: 'byAgent' | 'byTimeRange' | 'similar';
  limit?: number;
}

// ============================================================
// MemoryClient Class
// ============================================================

export class MemoryClient {
  private http: AxiosInstance;
  private agentId: string;

  constructor(agentId: string, memorySystemUrl?: string) {
    this.agentId = agentId;
    const baseURL = memorySystemUrl || process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';
    const apiKey = process.env.API_KEYS?.split(',')[0] || '';

    this.http = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || 'unknown';
        const status = error.response?.status || 'no-response';
        console.error(`[MemoryClient:${this.agentId}] Request failed: ${url} (${status})`);
        return Promise.reject(error);
      }
    );
  }

  // ============================================================
  // Short-Term Memory (Redis)
  // ============================================================

  /**
   * Store a value in short-term memory (Redis)
   * @param key - Unique key for this agent's memory
   * @param value - String value to store
   * @param ttl - Time-to-live in seconds (optional)
   */
  async setShortTerm(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.http.post('/memory/short-term', {
        agentId: this.agentId,
        key,
        value,
        ttl,
      });
      console.log(`[MemoryClient:${this.agentId}] Short-term memory set: ${key}`);
    } catch (error: any) {
      console.error(`[MemoryClient:${this.agentId}] Failed to set short-term memory [${key}]: ${error.message}`);
      // Non-fatal: continue operation even if memory fails
    }
  }

  /**
   * Retrieve a value from short-term memory (Redis)
   * @param key - Unique key for this agent's memory
   * @returns The stored value or null if not found
   */
  async getShortTerm(key: string): Promise<string | null> {
    try {
      const response = await this.http.get(`/memory/short-term/${this.agentId}/${key}`);
      return response.data.value ?? null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error(`[MemoryClient:${this.agentId}] Failed to get short-term memory [${key}]: ${error.message}`);
      return null;
    }
  }

  /**
   * Store a JSON object in short-term memory (serialized)
   */
  async setShortTermJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.setShortTerm(key, JSON.stringify(value), ttl);
  }

  /**
   * Retrieve and parse a JSON object from short-term memory
   */
  async getShortTermJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getShortTerm(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  // ============================================================
  // Long-Term Memory (ChromaDB)
  // ============================================================

  /**
   * Store a document in long-term memory (ChromaDB vector store)
   * @param document - Text content to store
   * @param embedding - Vector embedding of the document
   * @param metadata - Additional metadata for filtering
   * @returns Document ID
   */
  async storeLongTerm(document: string, embedding: number[], metadata?: Record<string, any>): Promise<string | null> {
    try {
      const response = await this.http.post('/memory/long-term', {
        agentId: this.agentId,
        document,
        embedding,
        metadata: {
          ...metadata,
          storedAt: new Date().toISOString(),
          agentId: this.agentId,
        },
      });
      const docId = response.data.id;
      console.log(`[MemoryClient:${this.agentId}] Long-term memory stored: ${docId}`);
      return docId;
    } catch (error: any) {
      console.error(`[MemoryClient:${this.agentId}] Failed to store long-term memory: ${error.message}`);
      return null;
    }
  }

  /**
   * Store a document in long-term memory using a simple text-based embedding
   * (Uses a hash-based pseudo-embedding for environments without LLM embedding service)
   */
  async storeLongTermText(document: string, metadata?: Record<string, any>): Promise<string | null> {
    const embedding = this.generateSimpleEmbedding(document);
    return this.storeLongTerm(document, embedding, metadata);
  }

  /**
   * Search long-term memory using vector similarity
   */
  async searchLongTerm(queryEmbedding: number[], nResults = 5, where?: Record<string, any>): Promise<SearchResult[]> {
    try {
      const response = await this.http.post('/memory/long-term/search', {
        agentId: this.agentId,
        queryEmbedding,
        nResults,
        where,
      });
      return response.data.results || [];
    } catch (error: any) {
      console.error(`[MemoryClient:${this.agentId}] Failed to search long-term memory: ${error.message}`);
      return [];
    }
  }

  /**
   * Search long-term memory using text query (generates simple embedding)
   */
  async searchLongTermText(query: string, nResults = 5, where?: Record<string, any>): Promise<SearchResult[]> {
    const queryEmbedding = this.generateSimpleEmbedding(query);
    return this.searchLongTerm(queryEmbedding, nResults, where);
  }

  // ============================================================
  // Shared State (Redis Key-Value)
  // ============================================================

  /**
   * Set a shared state value (accessible by all agents)
   */
  async setSharedState(key: string, value: any): Promise<void> {
    try {
      await this.http.post(`/memory/shared/${key}`, { value: JSON.stringify(value) });
      console.log(`[MemoryClient:${this.agentId}] Shared state set: ${key}`);
    } catch (error: any) {
      console.error(`[MemoryClient:${this.agentId}] Failed to set shared state [${key}]: ${error.message}`);
    }
  }

  /**
   * Get a shared state value
   */
  async getSharedState<T>(key: string): Promise<T | null> {
    try {
      const response = await this.http.get(`/memory/shared/${key}`);
      const raw = response.data.value;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      }
      return raw as T;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error(`[MemoryClient:${this.agentId}] Failed to get shared state [${key}]: ${error.message}`);
      return null;
    }
  }

  // ============================================================
  // Pub/Sub (Redis)
  // ============================================================

  /**
   * Publish a message to a shared channel
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.http.post('/memory/shared/publish', { channel, message });
      console.log(`[MemoryClient:${this.agentId}] Published to channel: ${channel}`);
    } catch (error: any) {
      console.error(`[MemoryClient:${this.agentId}] Failed to publish to channel [${channel}]: ${error.message}`);
    }
  }

  // ============================================================
  // Advanced Search
  // ============================================================

  /**
   * Perform advanced memory search
   */
  async advancedSearch(options: AdvancedSearchOptions): Promise<SearchResult[]> {
    try {
      const response = await this.http.post('/memory/search/advanced', {
        agentId: options.agentId || this.agentId,
        query: options.query,
        startTime: options.startTime,
        endTime: options.endTime,
        searchType: options.searchType,
        limit: options.limit,
      });
      return response.data.results || [];
    } catch (error: any) {
      console.error(`[MemoryClient:${this.agentId}] Advanced search failed: ${error.message}`);
      return [];
    }
  }

  // ============================================================
  // Health Check
  // ============================================================

  /**
   * Check if memory system is available
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.http.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  // ============================================================
  // Private Utilities
  // ============================================================

  /**
   * Generate a simple pseudo-embedding from text
   * This is a fallback when no LLM embedding service is available.
   * It creates a deterministic 128-dimensional vector from text hash.
   */
  private generateSimpleEmbedding(text: string): number[] {
    const dimension = 128;
    const embedding = new Array(dimension).fill(0);
    
    // Simple hash-based embedding
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const idx = (i * 7 + charCode * 13) % dimension;
      embedding[idx] = (embedding[idx] + charCode / 255) % 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map((val) => val / magnitude);
  }
}

// ============================================================
// Factory Function
// ============================================================

/**
 * Create a MemoryClient for a specific agent
 */
export function createMemoryClient(agentId: string, memorySystemUrl?: string): MemoryClient {
  return new MemoryClient(agentId, memorySystemUrl);
}

export default MemoryClient;
