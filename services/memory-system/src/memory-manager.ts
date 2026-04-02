import { RedisClient } from "./redis-client";
import { VectorDBClient } from "./vector-db-client";
import { ShortTermMemoryStoreRequest, LongTermMemoryStoreRequest, LongTermMemorySearchRequest, SearchResult } from "./types";

export class MemoryManager {
  private redisClient: RedisClient;
  private vectorDBClient: VectorDBClient;

  constructor(redisUrl: string, chromaDbUrl: string) {
    this.redisClient = new RedisClient(redisUrl);
    this.vectorDBClient = new VectorDBClient(chromaDbUrl);
  }

  async connect(): Promise<void> {
    await this.redisClient.connect();
    await this.vectorDBClient.connect();
    console.log("MemoryManager connected to Redis and ChromaDB.");
  }

  async disconnect(): Promise<void> {
    await this.redisClient.disconnect();
    // await this.vectorDBClient.disconnect(); // ChromaDB client doesn't have a disconnect method
    console.log("MemoryManager disconnected from Redis and ChromaDB.");
  }

  // Short-term memory (Redis)
  async storeShortTermMemory(data: ShortTermMemoryStoreRequest): Promise<string | null> {
    const { agentId, key, value, ttl } = data;
    const redisKey = `short-term:${agentId}:${key}`;
    try {
      console.log(`Storing short-term memory for agent ${agentId}, key: ${key}`);
      return await this.redisClient.set(redisKey, value, ttl);
    } catch (error) {
      console.error(`Error storing short-term memory for agent ${agentId}, key ${key}:`, error);
      throw error;
    }
  }

  async getShortTermMemory(agentId: string, key: string): Promise<string | null> {
    const redisKey = `short-term:${agentId}:${key}`;
    try {
      console.log(`Retrieving short-term memory for agent ${agentId}, key: ${key}`);
      return await this.redisClient.get(redisKey);
    } catch (error) {
      console.error(`Error retrieving short-term memory for agent ${agentId}, key ${key}:`, error);
      throw error;
    }
  }

  async deleteShortTermMemory(agentId: string, key: string): Promise<number> {
    const redisKey = `short-term:${agentId}:${key}`;
    try {
      console.log(`Deleting short-term memory for agent ${agentId}, key: ${key}`);
      return await this.redisClient.del(redisKey);
    } catch (error) {
      console.error(`Error deleting short-term memory for agent ${agentId}, key ${key}:`, error);
      throw error;
    }
  }

  // Long-term memory (ChromaDB)
  async storeLongTermMemory(data: LongTermMemoryStoreRequest): Promise<string> {
    const { agentId, document, embedding, metadata } = data;
    try {
      console.log(`Storing long-term memory for agent ${agentId}`);
      return await this.vectorDBClient.addDocument(agentId, document, embedding, metadata);
    } catch (error) {
      console.error(`Error storing long-term memory for agent ${agentId}:`, error);
      throw error;
    }
  }

  getVectorDBClient(): VectorDBClient {
    return this.vectorDBClient;
  }

  async searchLongTermMemory(data: LongTermMemorySearchRequest): Promise<SearchResult[]> {
    const { agentId, queryEmbedding, nResults, where } = data;
    try {
      console.log(`Searching long-term memory for agent ${agentId}`);
      return await this.vectorDBClient.search(agentId, queryEmbedding, nResults, where);
    } catch (error) {
      console.error(`Error searching long-term memory for agent ${agentId}:`, error);
      throw error;
    }
  }
}
