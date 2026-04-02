import { CampaignManager } from './campaign-manager';
import { Campaign, MarketData, MarketingReport, CampaignConfig } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

export class CMOAgent {
  private campaignManager: CampaignManager;

  constructor() {
    this.campaignManager = new CampaignManager();
  }

  public async start(): Promise<void> {
    console.log('CMO Agent: Starting marketing operations...');
    // Periodically analyze market data
    setInterval(() => this.analyzeMarketData(), 6 * 60 * 60 * 1000); // Every 6 hours
    // Periodically generate marketing report
    setInterval(() => this.generateMarketingReport(), 24 * 60 * 60 * 1000); // Every 24 hours
  }

  public async planCampaign(brief: string, config: Omit<CampaignConfig, 'name' | 'brief'>): Promise<Campaign> {
    console.log(`CMO Agent: Planning new campaign based on brief: ${brief}`);
    // Use LLM to generate a campaign name and refine the brief
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Given the following campaign brief, suggest a compelling campaign name and a refined, detailed brief:
Brief: ${brief}

Output in JSON format: { "name": "Campaign Name", "refinedBrief": "Detailed brief..." }`,
      model: 'gemini-2.5-flash',
    });
    const { name, refinedBrief } = llmResponse.data.jsonOutput;

    const campaignConfig: CampaignConfig = {
      name,
      brief: refinedBrief,
      ...config,
    };

    const campaign = await this.campaignManager.createCampaign(campaignConfig);
    await this.spawnCreativeTeam(campaign);
    return campaign;
  }

  public async spawnCreativeTeam(campaign: Campaign): Promise<void> {
    await this.campaignManager.spawnCreativeTeam(campaign);
  }

  public async reviewContent(campaignId: string, content: { type: string; value: string }[]): Promise<{ approved: boolean; comments?: string }> {
    console.log(`CMO Agent: Reviewing content for campaign ${campaignId}...`);
    // Use LLM to review content for brand consistency, messaging, and effectiveness
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Review the following marketing content for brand consistency, messaging effectiveness, and overall quality. Provide a clear approval status (true/false) and any comments for improvement.
Campaign ID: ${campaignId}
Content: ${JSON.stringify(content)}

Output in JSON format: { "approved": true/false, "comments": "..." }`,
      model: 'gemini-2.5-flash',
    });
    const { approved, comments } = llmResponse.data.jsonOutput;

    if (approved) {
      console.log(`CMO Agent: Content for campaign ${campaignId} approved.`);
      // In a real scenario, update campaign with creative assets
    } else {
      console.log(`CMO Agent: Content for campaign ${campaignId} rejected with comments: ${comments}`);
    }
    return { approved, comments };
  }

  public async analyzeMarketData(): Promise<MarketData> {
    console.log('CMO Agent: Analyzing market data...');
    // Use LLM to perform market research based on current trends or specific queries
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Perform a brief market analysis on current digital marketing trends and consumer behavior shifts. Identify key opportunities and challenges.

Output in JSON format: { "topic": "Market Analysis", "data": { "trends": [], "behavior": [] }, "analysis": "Summary of findings..." }`,
      model: 'gemini-2.5-flash',
    });
    const { topic, data, analysis } = llmResponse.data.jsonOutput;

    const marketData: MarketData = {
      id: uuidv4(),
      topic,
      data,
      analysis,
      timestamp: Date.now(),
    };
    await this.saveToMemory(marketData);
    console.log('CMO Agent: Market data analysis completed and saved.');
    return marketData;
  }

  public async generateMarketingReport(): Promise<MarketingReport> {
    console.log('CMO Agent: Generating daily marketing report...');
    const campaigns = this.campaignManager.getAllCampaigns();
    const marketInsights = await this.getMarketDataFromMemory(); // Fetch from memory

    // Use LLM to summarize campaign performance and market insights
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Generate a comprehensive marketing report based on the following campaign summaries and market insights. Include key performance indicators, market trends, and strategic recommendations.
Campaigns: ${JSON.stringify(campaigns.map(c => ({ id: c.id, name: c.name, status: c.status, metrics: c.metrics })))} 
Market Insights: ${JSON.stringify(marketInsights.map(m => ({ topic: m.topic, analysis: m.analysis })))} 

Output in JSON format: { "campaignSummaries": [], "marketInsights": [], "recommendations": [] }`,
      model: 'gemini-2.5-flash',
    });
    const { campaignSummaries, marketInsights: reportMarketInsights, recommendations } = llmResponse.data.jsonOutput;

    const report: MarketingReport = {
      date: new Date().toISOString().split('T')[0],
      campaignSummaries,
      marketInsights: reportMarketInsights,
      recommendations,
    };
    await this.saveToMemory(report);
    console.log('CMO Agent: Marketing report generated and saved.');
    return report;
  }

  public async getCampaigns(): Promise<Campaign[]> {
    return this.campaignManager.getAllCampaigns();
  }

  public async getMarketAnalysis(): Promise<MarketData[]> {
    return this.getMarketDataFromMemory();
  }

  private async saveToMemory(data: MarketData | MarketingReport): Promise<void> {
    try {
      const dataType = 'analysis' in data ? 'market_data' : 'marketing_report';
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'cmo-agent',
        data: data,
        embedding: JSON.stringify(data), // Simple embedding for now
        metadata: { type: dataType, id: data.id || uuidv4(), timestamp: Date.now() },
      });
      console.log(`CMO Agent: Saved ${dataType} to long-term memory.`);
    } catch (error) {
      console.error(`CMO Agent: Failed to save ${dataType} to memory:`, error);
    }
  }

  private async getMarketDataFromMemory(): Promise<MarketData[]> {
    // In a real scenario, query memory system for market data
    // For now, return a placeholder or empty array
    return [];
  }
}
