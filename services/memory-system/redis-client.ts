import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;

  constructor(private url: string) {
    this.client = createClient({ url: this.url });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log('Connected to Redis');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
      console.log('Disconnected from Redis');
    }
  }

  async set(key: string, value: string, expiryInSeconds?: number): Promise<string | null> {
    if (!this.client.isOpen) await this.connect();
    if (expiryInSeconds) {
      return this.client.set(key, value, { EX: expiryInSeconds });
    } else {
      return this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client.isOpen) await this.connect();
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    if (!this.client.isOpen) await this.connect();
    return this.client.del(key);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    if (!this.client.isOpen) await this.connect();
    return this.client.hSet(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | null> {
    if (!this.client.isOpen) await this.connect();
    return this.client.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    if (!this.client.isOpen) await this.connect();
    return this.client.hGetAll(key);
  }
}
