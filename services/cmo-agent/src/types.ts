export interface Campaign {
  id: string;
  name: string;
  brief: string;
  status: 'planning' | 'creative_development' | 'review' | 'active' | 'completed' | 'cancelled';
  budget: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  channels: string[];
  creativeAssets?: string[]; // URLs or IDs of creative assets
  metrics?: { [key: string]: any };
}

export interface MarketData {
  id: string;
  topic: string;
  data: any; // Raw data from market research
  analysis: string; // LLM-generated analysis
  timestamp: number;
}

export interface MarketingReport {
  date: string;
  campaignSummaries: { campaignId: string; name: string; status: string; performance: any }[];
  marketInsights: MarketData[];
  recommendations: string[];
}

export interface CampaignConfig {
  name: string;
  brief: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  channels: string[];
}
