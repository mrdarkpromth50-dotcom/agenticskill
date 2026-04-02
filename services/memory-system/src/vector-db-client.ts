import { ChromaClient, Collection, IEmbeddingFunction } from "chromadb";
import { v4 as uuidv4 } from 'uuid';

// A simple embedding function for demonstration purposes if not provided by the caller.
// In a real scenario, this would be a call to an actual embedding model service.
class SimpleEmbeddingFunction implements IEmbeddingFunction {
  public async generate(texts: string[]): Promise<number[][]> {
    // This is a placeholder. Replace with a real embedding model.
    console.warn("Using placeholder embedding function. Replace with a real model.");
    return texts.map(text => Array.from({ length: 1536 }, () => Math.random()));
  }
}

export class VectorDBClient {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string = "agent_memory";

  constructor(url: string) {
    this.client = new ChromaClient({ path: url });
  }

  async connect(): Promise<void> {
    try {
      // Using a simple embedding function for chromadb, as it requires one.
      // The actual embeddings for documents will be provided by the caller.
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        // embeddingFunction: new SimpleEmbeddingFunction() // ChromaDB client requires this, but we will provide embeddings directly.
      });
      console.log(`Connected to ChromaDB and collection '${this.collectionName}' is ready.`);
    } catch (error) {
      console.error("Failed to connect to ChromaDB:", error);
      throw error;
    }
  }

  async addDocument(agentId: string, document: string, embedding: number[], metadata: Record<string, any> = {}): Promise<string> {
    if (!this.collection) {
      throw new Error("Vector DB collection not initialized. Call connect() first.");
    }
    const id = uuidv4();
    const docMetadata = { ...metadata, agentId };

    try {
      await this.collection.add({
        ids: [id],
        documents: [document],
        embeddings: [embedding],
        metadatas: [docMetadata],
      });
      console.log(`Added document with ID: ${id} for agent: ${agentId}`);
      return id;
    } catch (error) {
      console.error(`Failed to add document for agent ${agentId}:`, error);
      throw error;
    }
  }

  async search(agentId: string, queryEmbedding: number[], nResults: number = 5, where: Record<string, any> = {}): Promise<any[]> {
    if (!this.collection) {
      throw new Error("Vector DB collection not initialized. Call connect() first.");
    }

    const searchWhere = { ...where, agentId };

    try {
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: nResults,
        where: searchWhere,
      });

      console.log(`Found ${results.ids[0].length} results for agent ${agentId}`);

      if (!results.documents || !results.ids || !results.metadatas || !results.distances) {
        return [];
      }

      return results.documents[0].map((doc, index) => ({
        id: results.ids[0][index],
        document: doc,
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index],
      }));
    } catch (error) {
      console.error(`Failed to search documents for agent ${agentId}:`, error);
      throw error;
    }
  }
}
