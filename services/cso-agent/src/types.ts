export interface CompetitorAnalysis {
  id: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketShare: number;
  timestamp: number;
}

export interface StrategicGoal {
  id: string;
  name: string;
  description: string;
  targetMetrics: { metric: string; target: number; unit: string }[];
  startDate: string;
  endDate: string;
}

export interface StrategyPlan {
  id: string;
  goalId: string;
  title: string;
  description: string;
  steps: { step: string; assignedAgentType: string; dependencies: string[] }[];
  risks: { risk: string; mitigation: string }[];
  status: 'draft' | 'under_review' | 'approved' | 'executing' | 'completed';
  timestamp: number;
}

export interface StrategyReport {
  date: string;
  strategicGoals: StrategicGoal[];
  activePlans: StrategyPlan[];
  competitorInsights: CompetitorAnalysis[];
  recommendations: string[];
}
