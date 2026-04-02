import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, { lazyConnect: true });
    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('Connected to Redis'));
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    console.log('Disconnected from Redis');
  }

  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl);
    } else {
      return this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hDel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }
}
