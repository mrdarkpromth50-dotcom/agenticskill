import { VectorDBClient } from './vector-db-client';
import { MemoryRecord } from './types';

export class MemorySearch {
  private vectorDBClient: VectorDBClient;

  constructor(vectorDBClient: VectorDBClient) {
    this.vectorDBClient = vectorDBClient;
    console.log("MemorySearch initialized.");
  }

  /**
   * Searches for memories by agent ID and an optional query.
   * @param agentId The ID of the agent to filter by.
   * @param query An optional query string for semantic search.
   * @param limit The maximum number of results to return.
   * @returns A promise that resolves to an array of MemoryRecord.
   */
  async searchByAgent(agentId: string, query?: string, limit: number = 10): Promise<MemoryRecord[]> {
    console.log(`Searching memories for agent: ${agentId} with query: ${query || "(none)"}`);
    const filters = { agentId: agentId };
    return this.vectorDBClient.search(query || "", limit, filters);
  }

  /**
   * Searches for memories within a specific time range and an optional query.
   * @param startTime Unix timestamp (milliseconds) for the start of the range.
   * @param endTime Unix timestamp (milliseconds) for the end of the range.
   * @param query An optional query string for semantic search.
   * @param limit The maximum number of results to return.
   * @returns A promise that resolves to an array of MemoryRecord.
   */
  async searchByTimeRange(startTime: number, endTime: number, query?: string, limit: number = 10): Promise<MemoryRecord[]> {
    console.log(`Searching memories between ${new Date(startTime).toISOString()} and ${new Date(endTime).toISOString()} with query: ${query || "(none)"}`);
    const filters = {
      timestamp: {
        $gte: startTime,
        $lte: endTime,
      },
    };
    return this.vectorDBClient.search(query || "", limit, filters);
  }

  /**
   * Searches for memories semantically similar to the given text.
   * @param text The text to find similar memories for.
   * @param limit The maximum number of results to return.
   * @returns A promise that resolves to an array of MemoryRecord.
   */
  async searchSimilar(text: string, limit: number = 10): Promise<MemoryRecord[]> {
    console.log(`Searching similar memories for text: ${text}`);
    return this.vectorDBClient.search(text, limit);
  }
}
