import axios from 'axios';
import { TrendItem, Proposal } from './types';

const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

export class TrendResearchEngine {
  private llmCall: (prompt: string, model?: string) => Promise<string>;

  constructor(llmCall: (prompt: string, model?: string) => Promise<string>) {
    this.llmCall = llmCall;
  }

  public async searchTrends(): Promise<TrendItem[]> {
    console.log('[TrendResearchEngine] Searching for new trends...');
    const prompt = `Analyze the latest global trends in AI, technology, and business. Identify 3-5 significant trends that could impact an agentic AI company. For each trend, provide a concise title, a brief summary, and potential implications. Format the output as a JSON array of objects with 'title', 'summary', and 'implications' fields.`;
    
    try {
      const llmResponse = await this.llmCall(prompt);
      const trends = JSON.parse(llmResponse) as TrendItem[];
      console.log(`[TrendResearchEngine] Found ${trends.length} trends.`);
      return trends;
    } catch (error) {
      console.error('[TrendResearchEngine] Error searching trends:', error);
      return [];
    }
  }

  public async analyzeTrend(trend: TrendItem): Promise<{ relevance: number; impact: 'low' | 'medium' | 'high' }> {
    console.log(`[TrendResearchEngine] Analyzing trend: ${trend.title}`);
    const prompt = `Analyze the following trend for its relevance (0-100) and potential impact (low/medium/high) on an agentic AI company. Provide the output as a JSON object with 'relevance' (number) and 'impact' (string) fields.\n\nTrend Title: ${trend.title}\nTrend Summary: ${trend.summary}\nImplications: ${trend.implications}`;

    try {
      const llmResponse = await this.llmCall(prompt);
      const analysis = JSON.parse(llmResponse);
      console.log(`[TrendResearchEngine] Trend analysis for '${trend.title}': Relevance=${analysis.relevance}, Impact=${analysis.impact}`);
      return analysis;
    } catch (error) {
      console.error(`[TrendResearchEngine] Error analyzing trend '${trend.title}':`, error);
      return { relevance: 0, impact: 'low' };
    }
  }

  public async createProposal(trend: TrendItem, analysis: { relevance: number; impact: 'low' | 'medium' | 'high' }): Promise<Proposal> {
    console.log(`[TrendResearchEngine] Creating proposal for trend: ${trend.title}`);
    const prompt = `Based on the following trend and its analysis, create a structured business proposal for an agentic AI company. The proposal should include: 'title', 'summary', 'impact' (from analysis), 'actionItems' (a list of concrete steps), 'estimatedCost' (e.g., 'low', 'medium', 'high'), and 'estimatedTime' (e.g., 'short-term', 'medium-term', 'long-term'). Format the output as a JSON object.\n\nTrend Title: ${trend.title}\nTrend Summary: ${trend.summary}\nImplications: ${trend.implications}\nRelevance: ${analysis.relevance}\nImpact: ${analysis.impact}`;

    try {
      const llmResponse = await this.llmCall(prompt);
      const proposal = JSON.parse(llmResponse) as Proposal;
      proposal.id = `proposal-${Date.now()}`;
      proposal.createdAt = new Date().toISOString();
      console.log(`[TrendResearchEngine] Proposal created for '${trend.title}'.`);
      return proposal;
    } catch (error) {
      console.error(`[TrendResearchEngine] Error creating proposal for '${trend.title}':`, error);
      throw new Error(`Failed to create proposal: ${error.message}`);
    }
  }

  public async saveToMemory(proposal: Proposal): Promise<void> {
    console.log(`[TrendResearchEngine] Saving proposal '${proposal.title}' to long-term memory.`);
    try {
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'ceo-agent',
        key: `proposal-${proposal.id}`,
        content: JSON.stringify(proposal),
        metadata: { type: 'proposal', title: proposal.title, impact: proposal.impact, createdAt: proposal.createdAt },
      });
      console.log(`[TrendResearchEngine] Proposal '${proposal.title}' saved to memory.`);
    } catch (error) {
      console.error(`[TrendResearchEngine] Error saving proposal '${proposal.title}' to memory:`, error);
      throw new Error(`Failed to save proposal to memory: ${error.message}`);
    }
  }

  public async getStoredProposals(): Promise<Proposal[]> {
    console.log('[TrendResearchEngine] Retrieving stored proposals from memory.');
    try {
      const response = await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term/search`, {
        agentId: 'ceo-agent',
        query: 'all proposals',
        filter: { type: 'proposal' },
        topK: 100, // Retrieve a reasonable number of proposals
      });
      const rawProposals = response.data.results;
      const proposals: Proposal[] = rawProposals.map((item: any) => JSON.parse(item.content));
      console.log(`[TrendResearchEngine] Retrieved ${proposals.length} proposals.`);
      return proposals;
    } catch (error) {
      console.error('[TrendResearchEngine] Error retrieving proposals from memory:', error);
      return [];
    }
  }
}
