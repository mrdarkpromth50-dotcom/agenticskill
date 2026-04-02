export interface Embedding {
  id: string;
  vector: number[];
  text: string;
  metadata: Record<string, any>;
}

export interface SearchResult {
  document: string;
  id: string;
  metadata: Record<string, any>;
  distance: number;
}
