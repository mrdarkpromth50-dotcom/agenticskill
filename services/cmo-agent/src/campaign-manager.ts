import { Campaign, CampaignConfig } from './types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

export class CampaignManager {
  private campaigns: Map<string, Campaign> = new Map();

  constructor() {
    // In a real scenario, load existing campaigns from memory
  }

  public async createCampaign(config: CampaignConfig): Promise<Campaign> {
    console.log(`Campaign Manager: Creating new campaign: ${config.name}`);
    const newCampaign: Campaign = {
      id: uuidv4(),
      name: config.name,
      brief: config.brief,
      status: 'planning',
      budget: config.budget,
      startDate: config.startDate,
      endDate: config.endDate,
      targetAudience: config.targetAudience,
      channels: config.channels,
    };
    this.campaigns.set(newCampaign.id, newCampaign);
    await this.saveCampaignToMemory(newCampaign);
    return newCampaign;
  }

  public getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  public getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  public async updateCampaignStatus(id: string, status: Campaign['status'], metrics?: any): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.status = status;
      if (metrics) {
        campaign.metrics = { ...campaign.metrics, ...metrics };
      }
      await this.saveCampaignToMemory(campaign);
      return campaign;
    }
    return undefined;
  }

  public async trackCampaign(id: string): Promise<Campaign | undefined> {
    // In a real scenario, this would involve polling Spawn Manager for task status
    // and potentially external marketing platforms for performance data.
    console.log(`Campaign Manager: Tracking campaign ${id}...`);
    const campaign = this.campaigns.get(id);
    if (campaign && campaign.status === 'active') {
      // Simulate updating metrics
      campaign.metrics = {
        impressions: (campaign.metrics?.impressions || 0) + Math.floor(Math.random() * 10000),
        clicks: (campaign.metrics?.clicks || 0) + Math.floor(Math.random() * 500),
        conversions: (campaign.metrics?.conversions || 0) + Math.floor(Math.random() * 50),
      };
      await this.saveCampaignToMemory(campaign);
    }
    return campaign;
  }

  public async evaluateResults(id: string): Promise<any> {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      console.log(`Campaign Manager: Evaluating results for campaign ${id}...`);
      // In a real scenario, use LLM to analyze campaign metrics and provide insights
      const evaluation = {
        overallPerformance: campaign.metrics && campaign.metrics.conversions > 100 ? 'Excellent' : 'Good',
        roi: Math.random() * 200, // Simulated ROI
        recommendations: 'Increase budget for high-performing channels.',
      };
      await this.updateCampaignStatus(id, 'completed', { evaluation });
      return evaluation;
    }
    return undefined;
  }

  public async spawnCreativeTeam(campaign: Campaign): Promise<void> {
    console.log(`Campaign Manager: Spawning creative team for campaign ${campaign.id}...`);
    try {
      // Spawn Copywriter Agent
      await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: 'copywriter-agent',
        description: `Create compelling ad copy for campaign: ${campaign.name}`,
        payload: { campaignId: campaign.id, brief: campaign.brief, targetAudience: campaign.targetAudience, channels: campaign.channels },
      });
      // Spawn Designer Agent
      await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: 'designer-agent',
        description: `Design engaging visuals for campaign: ${campaign.name}`,
        payload: { campaignId: campaign.id, brief: campaign.brief, targetAudience: campaign.targetAudience, channels: campaign.channels },
      });
      await this.updateCampaignStatus(campaign.id, 'creative_development');
      console.log(`Campaign Manager: Creative team spawned for campaign ${campaign.id}.`);
    } catch (error) {
      console.error(`Campaign Manager: Failed to spawn creative team for campaign ${campaign.id}:`, error);
    }
  }

  private async saveCampaignToMemory(campaign: Campaign): Promise<void> {
    try {
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'cmo-agent',
        data: campaign,
        embedding: JSON.stringify(campaign), // Simple embedding for now
        metadata: { type: 'campaign', campaignId: campaign.id, name: campaign.name, status: campaign.status },
      });
      console.log(`Campaign Manager: Saved campaign ${campaign.id} to long-term memory.`);
    } catch (error) {
      console.error(`Campaign Manager: Failed to save campaign ${campaign.id} to memory:`, error);
    }
  }
}
