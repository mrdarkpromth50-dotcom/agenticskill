import { CompetitorAnalysis, StrategicGoal, StrategyPlan } from './types';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://memory-system:3001';

export class StrategyEngine {
  constructor() {}

  public async swotAnalysis(data: any): Promise<{ strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }> {
    console.log('Strategy Engine: Performing SWOT analysis...');
    try {
      const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
        prompt: `Perform a SWOT analysis based on the following data. Identify key strengths, weaknesses, opportunities, and threats.
Data: ${JSON.stringify(data)}

Output in JSON format: { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] }`,
        model: 'gemini-2.5-flash',
      });
      const { strengths, weaknesses, opportunities, threats } = llmResponse.data.jsonOutput;
      return { strengths, weaknesses, opportunities, threats };
    } catch (error) {
      console.error('Strategy Engine: Failed to perform SWOT analysis:', error);
      throw error;
    }
  }

  public async marketPositioning(data: any): Promise<{ positioningStatement: string; targetMarket: string; competitiveAdvantages: string[] }> {
    console.log('Strategy Engine: Analyzing market positioning...');
    try {
      const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
        prompt: `Analyze the market positioning based on the following data. Provide a positioning statement, identify the target market, and list competitive advantages.
Data: ${JSON.stringify(data)}

Output in JSON format: { "positioningStatement": "", "targetMarket": "", "competitiveAdvantages": [] }`,
        model: 'gemini-2.5-flash',
      });
      const { positioningStatement, targetMarket, competitiveAdvantages } = llmResponse.data.jsonOutput;
      return { positioningStatement, targetMarket, competitiveAdvantages };
    } catch (error) {
      console.error('Strategy Engine: Failed to analyze market positioning:', error);
      throw error;
    }
  }

  public async competitiveAdvantage(data: any): Promise<string[]> {
    console.log('Strategy Engine: Identifying competitive advantages...');
    try {
      const llmResponse = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
        prompt: `Identify key competitive advantages based on the following data.
Data: ${JSON.stringify(data)}

Output in JSON format: { "advantages": [] }`,
        model: 'gemini-2.5-flash',
      });
      const { advantages } = llmResponse.data.jsonOutput;
      return advantages;
    } catch (error) {
      console.error('Strategy Engine: Failed to identify competitive advantages:', error);
      throw error;
    }
  }

  public async saveToMemory(data: CompetitorAnalysis | StrategicGoal | StrategyPlan): Promise<void> {
    try {
      const dataType = 'competitorName' in data ? 'competitor_analysis' : ('targetMetrics' in data ? 'strategic_goal' : 'strategy_plan');
      await axios.post(`${MEMORY_SYSTEM_URL}/memory/long-term`, {
        agentId: 'cso-agent',
        data: data,
        embedding: JSON.stringify(data), // Simple embedding for now
        metadata: { type: dataType, id: data.id, timestamp: Date.now() },
      });
      console.log(`CSO Agent: Saved ${dataType} ${data.id} to long-term memory.`);
    } catch (error) {
      console.error(`CSO Agent: Failed to save data to memory:`, error);
    }
  }
}
