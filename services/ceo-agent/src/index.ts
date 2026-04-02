import { CEOAgent } from './ceo-logic';
import { DiscordCommunicator, TelegramCommunicator } from './communication';
import { CEOAgentConfig } from './types';

async function main() {
  console.log('Starting CEO Agent Service...');

  // Load CEO Agent configuration (from config/agents/ceo.json)
  const ceoConfig: CEOAgentConfig = {
    id: 'ceo',
    name: 'CEO Agent',
    role: 'Chief Executive Officer',
    type: 'persistent',
    personality: 'Strategic, decisive, visionary, calm under pressure, results-oriented.',
    communication_style: 'Formal, concise, directive, prioritizes clarity and actionable insights.',
    skills: ['management_strategic_planning', 'management_task_delegation', 'management_reporting', 'management_risk_assessment', 'management_proactive_research'],
    tools: ['telegram_cli', 'discord_cli', 'openclaw_cli', 'llm_access', 'internal_reporting_tool', 'trend_analysis_tool'],
    system_prompt: 'You are the CEO Agent of an Agentic Company. Your primary responsibility is to oversee all operations, translate the Boss\'s high-level commands into actionable plans, and ensure the company\'s strategic objectives are met. You are the sole point of contact with the Boss. You must never ask the Boss for clarification during task execution. All decisions during a task must be made autonomously. Only report to the Boss upon task completion or to proactively propose new trends/opportunities. Your communication with the Boss is formal and concise. You manage a team of Persistent and Spawn-on-Demand Agents. Your goal is 100% autonomous task completion. Prioritize efficiency, quality, and strategic alignment. Use the Translation Layer for all external communications with LLM providers if necessary.'
  };

  const discordCommunicator = new DiscordCommunicator(process.env.DISCORD_BOT_TOKEN!, process.env.DISCORD_GUILD_ID!);
  const telegramCommunicator = new TelegramCommunicator(process.env.TELEGRAM_BOT_TOKEN!, process.env.TELEGRAM_CHAT_ID!);

  const ceoAgent = new CEOAgent(ceoConfig, discordCommunicator, telegramCommunicator);
  await ceoAgent.start();

  console.log('CEO Agent Service started.');
}

main().catch(error => {
  console.error('CEO Agent Service failed to start:', error);
  process.exit(1);
});
