import { AccountManager } from './rotation';
import { startHealthCheck } from './health-check';
import { LLMAccount } from './types';

async function main() {
  console.log('Starting LLM Account Manager Service...');

  // Load LLM account configurations (example, replace with actual loading mechanism)
  const llmAccounts: LLMAccount[] = [
    // Example: { id: 'google-gemini-1', type: 'gemini', apiKey: '...', email: 'account1@gmail.com', password: '...' },
    // { id: 'openai-opus-1', type: 'opus', apiKey: '...', email: 'account2@gmail.com', password: '...' },
  ];

  const manager = new AccountManager(llmAccounts);
  startHealthCheck(manager);

  console.log('LLM Account Manager Service started.');
}

main().catch(error => {
  console.error('LLM Account Manager Service failed to start:', error);
  process.exit(1);
});
