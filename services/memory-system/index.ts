import { RedisClient } from './redis-client';
import { VectorDBClient } from './vector-db-client';
import { MemoryManager } from './memory-manager';

async function main() {
  console.log('Starting Memory System Service...');

  const redisClient = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');
  await redisClient.connect();

  const vectorDBClient = new VectorDBClient(process.env.VECTOR_DB_URL || 'http://localhost:8000', process.env.VECTOR_DB_TYPE || 'chromadb');
  await vectorDBClient.connect();

  const memoryManager = new MemoryManager(redisClient, vectorDBClient);

  console.log('Memory System Service started.');

  // Example usage (for testing/demonstration)
  // await memoryManager.saveShortTermMemory('ceo', 'last_task', 'Plan for Q3 growth');
  // const lastTask = await memoryManager.getShortTermMemory('ceo', 'last_task');
  // console.log('CEO last task:', lastTask);

  // await memoryManager.saveLongTermMemory('ceo', 'strategic_plan_doc', 'Detailed Q3 strategic plan document content...');
  // const strategicPlan = await memoryManager.searchLongTermMemory('ceo', 'Q3 growth strategy');
  // console.log('CEO strategic plan search:', strategicPlan);
}

main().catch(error => {
  console.error('Memory System Service failed to start:', error);
  process.exit(1);
});
