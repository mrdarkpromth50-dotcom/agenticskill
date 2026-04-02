import { VectorDBClient } from './vector-db-client';
import { MemoryRecord } from './types';

export class MemorySearch {
  private vectorDBClient: VectorDBClient;

  constructor(vectorDBClient: VectorDBClient) {
    this.vectorDBClient = vectorDBClient;
    console.log("MemorySearch initialized.");
  }

  // Generate a simple placeholder embedding from text
  private generatePlaceholderEmbedding(text: string): number[] {
    // Simple hash-based embedding for search (placeholder)
    return Array.from({ length: 1536 }, (_, i) => {
      const charCode = text.charCodeAt(i % text.length) || 0;
      return (charCode / 255) * 2 - 1;
    });
  }

  async searchByAgent(agentId: string, query?: string, limit: number = 10): Promise<MemoryRecord[]> {
    console.log(`Searching memories for agent: ${agentId} with query: ${query || "(none)"}`);
    const queryEmbedding = this.generatePlaceholderEmbedding(query || "");
    const filters = { agentId: agentId };
    return this.vectorDBClient.search(agentId, queryEmbedding, limit, filters) as Promise<MemoryRecord[]>;
  }

  async searchByTimeRange(startTime: number, endTime: number, query?: string, limit: number = 10): Promise<MemoryRecord[]> {
    console.log(`Searching memories between ${new Date(startTime).toISOString()} and ${new Date(endTime).toISOString()} with query: ${query || "(none)"}`);
    const queryEmbedding = this.generatePlaceholderEmbedding(query || "");
    const filters = {
      timestamp: {
        $gte: startTime,
        $lte: endTime,
      },
    };
    return this.vectorDBClient.search("system", queryEmbedding, limit, filters) as Promise<MemoryRecord[]>;
  }

  async searchSimilar(text: string, limit: number = 10): Promise<MemoryRecord[]> {
    console.log(`Searching similar memories for text: ${text}`);
    const queryEmbedding = this.generatePlaceholderEmbedding(text);
    return this.vectorDBClient.search("system", queryEmbedding, limit) as Promise<MemoryRecord[]>;
  }
}
