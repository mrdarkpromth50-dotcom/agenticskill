import { StrategyEngine } from './strategy-engine';
import { CompetitorAnalysis, StrategicGoal, StrategyPlan, StrategyReport } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';
const SPAWN_MANAGER_URL = process.env.SPAWN_MANAGER_URL || 'http://spawn-manager:3003';

export class CSOAgent {
  private strategyEngine: StrategyEngine;
  private activeGoals: Map<string, StrategicGoal> = new Map();
  private activePlans: Map<string, StrategyPlan> = new Map();

  constructor() {
    this.strategyEngine = new StrategyEngine();
  }

  public async start(): Promise<void> {
    console.log('CSO Agent: Starting strategic operations...');
    // Periodically analyze competitors
    setInterval(() => this.analyzeCompetitors(), 24 * 60 * 60 * 1000); // Every 24 hours
    // Periodically generate strategy report
    setInterval(() => this.generateStrategyReport(), 24 * 60 * 60 * 1000); // Every 24 hours
  }

  public async analyzeCompetitors(): Promise<CompetitorAnalysis> {
    console.log('CSO Agent: Analyzing competitors...');
    // Use LLM to gather and analyze competitor data
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Perform a comprehensive competitor analysis for a company operating in the AI agent development space. Identify key competitors, their strengths, weaknesses, market share, and recent activities.

Output in JSON format: { "competitorName": "", "strengths": [], "weaknesses": [], "opportunities": [], "threats": [], "marketShare": 0 }`,
      model: 'gemini-2.5-flash',
    });
    const { competitorName, strengths, weaknesses, opportunities, threats, marketShare } = llmResponse.data.jsonOutput;

    const analysis: CompetitorAnalysis = {
      id: uuidv4(),
      competitorName,
      strengths,
      weaknesses,
      opportunities,
      threats,
      marketShare,
      timestamp: Date.now(),
    };
    await this.strategyEngine.saveToMemory(analysis);
    console.log('CSO Agent: Competitor analysis completed and saved.');
    return analysis;
  }

  public async developStrategy(goal: StrategicGoal): Promise<StrategyPlan> {
    console.log(`CSO Agent: Developing strategy for goal: ${goal.name}...`);
    this.activeGoals.set(goal.id, goal);

    // Use LLM to develop a strategy plan based on the goal and current market conditions
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Develop a detailed strategic plan to achieve the following goal, considering current market conditions and competitor analysis. Include steps, assigned agent types, dependencies, and potential risks with mitigation strategies.
Goal: ${JSON.stringify(goal)}

Output in JSON format: { "title": "", "description": "", "steps": [], "risks": [] }`,
      model: 'gemini-2.5-flash',
    });
    const { title, description, steps, risks } = llmResponse.data.jsonOutput;

    const plan: StrategyPlan = {
      id: uuidv4(),
      goalId: goal.id,
      title,
      description,
      steps,
      risks,
      status: 'draft',
      timestamp: Date.now(),
    };
    this.activePlans.set(plan.id, plan);
    await this.strategyEngine.saveToMemory(plan);
    console.log(`CSO Agent: Strategy plan '${plan.title}' developed and saved.`);
    return plan;
  }

  public async assessRisk(plan: StrategyPlan): Promise<StrategyPlan> {
    console.log(`CSO Agent: Assessing risks for plan: ${plan.title}...`);
    // Use LLM to perform a more in-depth risk assessment
    const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
      prompt: `Assess the risks for the following strategic plan. Provide a detailed list of risks and their mitigation strategies.
Plan: ${JSON.stringify(plan)}

Output in JSON format: { "risks": [] }`,
      model: 'gemini-2.5-flash',
    });
    const { risks } = llmResponse.data.jsonOutput;
    plan.risks = risks;
    await this.strategyEngine.saveToMemory(plan);
    console.log(`CSO Agent: Risks assessed for plan '${plan.title}'.`);
    return plan;
  }

  public async spawnResearchTeam(topic: string): Promise<void> {
    console.log(`CSO Agent: Spawning Research Team for topic: ${topic}...`);
    try {
      // Spawn Researcher Agent
      await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: 'researcher-agent',
        description: `Conduct in-depth research on: ${topic}`,
        payload: { topic },
      });
      // Spawn Analyst Agent
      await axios.post(`${SPAWN_MANAGER_URL}/tasks`, {
        agentType: 'analyst-agent',
        description: `Analyze data related to: ${topic}`,
        payload: { topic },
      });
      console.log(`CSO Agent: Research team spawned for topic '${topic}'.`);
    } catch (error) {
      console.error(`CSO Agent: Failed to spawn research team for topic '${topic}':`, error);
    }
  }

  public async generateStrategyReport(): Promise<StrategyReport> {
    console.log('CSO Agent: Generating daily strategy report...');
    const competitorInsights = await this.getCompetitorInsightsFromMemory();
    const report: StrategyReport = {
      date: new Date().toISOString().split('T')[0],
      strategicGoals: Array.from(this.activeGoals.values()),
      activePlans: Array.from(this.activePlans.values()),
      competitorInsights,
      recommendations: ['Review market positioning based on latest competitor analysis.', 'Prioritize strategic goal X.'],
    };
    await this.strategyEngine.saveToMemory(report as any);
    console.log('CSO Agent: Strategy report generated and saved.');
    return report;
  }

  public getStrategyPlans(): StrategyPlan[] {
    return Array.from(this.activePlans.values());
  }

  public async getCompetitors(): Promise<CompetitorAnalysis[]> {
    return await this.getCompetitorInsightsFromMemory();
  }

  private async getCompetitorInsightsFromMemory(): Promise<CompetitorAnalysis[]> {
    // In a real scenario, query memory system for competitor analysis
    // For now, return a placeholder or empty array
    return [];
  }
}
