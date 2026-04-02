import { ChromaClient, Collection } from 'chromadb';

export class VectorDBClient {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;

  constructor(private url: string, private dbType: string) {}

  async connect(): Promise<void> {
    if (this.dbType === 'chromadb') {
      this.client = new ChromaClient({ path: this.url });
      // Ensure a default collection exists or create one
      this.collection = await this.client.getOrCreateCollection({ name: 'agent_memory' });
      console.log(`Connected to ChromaDB at ${this.url}`);
    } else {
      console.warn(`Unsupported Vector DB type: ${this.dbType}`);
      // Implement other DB types here
    }
  }

  async disconnect(): Promise<void> {
    // ChromaDB client doesn't have an explicit disconnect method for HTTP client
    this.client = null;
    this.collection = null;
    console.log('Disconnected from Vector DB (ChromaDB client reset).');
  }

  async addEmbedding(id: string, text: string, embedding: number[], metadata: Record<string, any>): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector DB collection not initialized.');
    }
    await this.collection.add({
      ids: [id],
      documents: [text],
      embeddings: [embedding],
      metadatas: [metadata],
    });
    console.log(`Added embedding for ID: ${id}`);
  }

  async search(queryEmbedding: number[], nResults: number, where?: Record<string, any>): Promise<any[]> {
    if (!this.collection) {
      throw new Error('Vector DB collection not initialized.');
    }
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults,
      where: where,
    });
    console.log(`Searched Vector DB for query. Found ${results.ids[0].length} results.`);
    return results.documents[0].map((doc, index) => ({
      document: doc,
      id: results.ids[0][index],
      metadata: results.metadatas[0][index],
      distance: results.distances[0][index],
    }));
  }

  async get(id: string): Promise<any> {
    if (!this.collection) {
      throw new Error('Vector DB collection not initialized.');
    }
    const result = await this.collection.get({
      ids: [id],
      include: ['documents', 'metadatas', 'embeddings'],
    });
    return result;
  }

  async delete(id: string): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector DB collection not initialized.');
    }
    await this.collection.delete({
      ids: [id],
    });
    console.log(`Deleted embedding for ID: ${id}`);
  }
}
