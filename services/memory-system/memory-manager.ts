import { RedisClient } from './redis-client';
import { VectorDBClient } from './vector-db-client';

export class MemoryManager {
  constructor(private redisClient: RedisClient, private vectorDBClient: VectorDBClient) {}

  // --- Short-term Memory (Redis) ---
  async saveShortTermMemory(agentId: string, key: string, value: string, expiryInSeconds?: number): Promise<void> {
    const redisKey = `short_term:${agentId}:${key}`;
    await this.redisClient.set(redisKey, value, expiryInSeconds);
  }

  async getShortTermMemory(agentId: string, key: string): Promise<string | null> {
    const redisKey = `short_term:${agentId}:${key}`;
    return this.redisClient.get(redisKey);
  }

  async deleteShortTermMemory(agentId: string, key: string): Promise<number> {
    const redisKey = `short_term:${agentId}:${key}`;
    return this.redisClient.del(redisKey);
  }

  // --- Long-term Memory (Vector DB) ---
  // Note: For long-term memory, we'd typically generate embeddings from text
  // and then store/search them. This example assumes embeddings are provided.
  async saveLongTermMemory(agentId: string, documentId: string, text: string, embedding: number[], metadata: Record<string, any>): Promise<void> {
    const fullMetadata = { agentId, ...metadata };
    await this.vectorDBClient.addEmbedding(documentId, text, embedding, fullMetadata);
  }

  async searchLongTermMemory(agentId: string, queryEmbedding: number[], nResults: number, filterMetadata?: Record<string, any>): Promise<any[]> {
    const whereClause = { agentId, ...filterMetadata };
    return this.vectorDBClient.search(queryEmbedding, nResults, whereClause);
  }

  async getLongTermMemory(documentId: string): Promise<any> {
    return this.vectorDBClient.get(documentId);
  }

  async deleteLongTermMemory(documentId: string): Promise<void> {
    await this.vectorDBClient.delete(documentId);
  }

  // --- Shared Memory (Redis Hash) ---
  async saveSharedMemory(namespace: string, key: string, value: string): Promise<void> {
    const redisKey = `shared:${namespace}`;
    await this.redisClient.hSet(redisKey, key, value);
  }

  async getSharedMemory(namespace: string, key: string): Promise<string | null> {
    const redisKey = `shared:${namespace}`;
    return this.redisClient.hGet(redisKey, key);
  }

  async getAllSharedMemory(namespace: string): Promise<Record<string, string>> {
    const redisKey = `shared:${namespace}`;
    return this.redisClient.hGetAll(redisKey);
  }

  async deleteSharedMemoryKey(namespace: string, key: string): Promise<number> {
    const redisKey = `shared:${namespace}`;
    return this.redisClient.hDel(redisKey, key);
  }

  async deleteSharedMemoryNamespace(namespace: string): Promise<number> {
    const redisKey = `shared:${namespace}`;
    return this.redisClient.del(redisKey);
  }
}
