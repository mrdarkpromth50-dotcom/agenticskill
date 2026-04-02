import axios from 'axios';
import { BossCommand, Task, ExecutionPlan } from './types';
import { v4 as uuidv4 } from 'uuid';

const ANTIGRAVITY_PROXY_URL = process.env.ANTIGRAVITY_PROXY_URL || 'http://antigravity-proxy:8080';

export class TaskPlanner {
  constructor() {
    console.log(`TaskPlanner initialized. Using Antigravity Proxy at: ${ANTIGRAVITY_PROXY_URL}`);
  }

  async analyzeCommand(command: BossCommand): Promise<any> {
    console.log(`Analyzing command: ${command.text}`);
    const prompt = `You are a highly intelligent AI assistant. Analyze the following command from the CEO and break it down into a detailed plan of subtasks. For each subtask, identify:
- a clear, concise description of the subtask
- the required agent type (e.g., 'developer', 'researcher', 'designer', 'copywriter')
- any dependencies on other subtasks (by their index in the generated list)
- estimated time (in hours)
- estimated cost (in USD)

Return the plan as a JSON array of objects. Example:
[
  {
    "id": "subtask-1",
    "description": "Research market trends for new product",
    "agentType": "researcher",
    "dependencies": [],
    "estimatedTime": 4,
    "estimatedCost": 20
  },
  {
    "id": "subtask-2",
    "description": "Develop frontend for user authentication",
    "agentType": "developer",
    "dependencies": ["subtask-1"],
    "estimatedTime": 8,
    "estimatedCost": 40
  }
]

CEO Command: ${command.text}

JSON Plan:`;

    try {
      const response = await axios.post(`${ANTIGRAVITY_PROXY_URL}/generate`, {
        prompt: prompt,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const llmResponse = response.data.choices[0].text.trim();
      console.log("LLM Analysis Response:", llmResponse);

      // Attempt to parse JSON, handle potential LLM errors
      try {
        const parsedPlan = JSON.parse(llmResponse);
        return parsedPlan;
      } catch (jsonError) {
        console.error("Failed to parse LLM response as JSON:", jsonError);
        console.error("LLM Response was:", llmResponse);
        return { error: "LLM response was not valid JSON", rawResponse: llmResponse };
      }

    } catch (error) {
      console.error("Error communicating with Antigravity Proxy for analysis:", (error as any).message);
      return { error: "Failed to get analysis from LLM", details: (error as any).message };
    }
  }

  createExecutionPlan(analysis: any[]): ExecutionPlan {
    console.log("Creating execution plan from analysis.");
    const tasks: Task[] = analysis.map((item: any, index: number) => ({
      id: item.id || `task-${index + 1}`,
      description: item.description,
      agentType: item.agentType,
      dependencies: item.dependencies || [],
      estimatedTime: item.estimatedTime || 0,
      estimatedCost: item.estimatedCost || 0,
      status: 'pending',
      assignedAgentId: undefined,
      result: undefined,
      startTime: undefined,
      endTime: undefined,
    }));

    return {
      id: uuidv4(),
      bossCommand: 'auto-generated',
      overallGoal: 'Execute plan from analysis',
      tasks,
      status: 'planning' as const,
      createdAt: Date.now(),
    };
  }

  estimateResources(plan: ExecutionPlan): { totalTime: number; totalCost: number } {
    console.log("Estimating resources for the plan.");
    const totalTime = plan.tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
    const totalCost = plan.tasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0);
    return { totalTime, totalCost };
  }
}
