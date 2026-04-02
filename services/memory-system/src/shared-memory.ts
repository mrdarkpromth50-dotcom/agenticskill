import Redis from 'ioredis';

export class SharedMemory {
  private publisher: Redis;
  private subscriber: Redis;
  private stateStore: Redis;

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    this.stateStore = new Redis(redisUrl);
    console.log(`SharedMemory initialized with Redis URL: ${redisUrl}`);

    this.subscriber.on('message', (channel, message) => {
      console.log(`[SharedMemory] Received message on channel ${channel}: ${message}`);
      // In a real scenario, you might want to emit this to registered callbacks
    });

    this.subscriber.on('error', (err) => {
      console.error('[SharedMemory] Subscriber Redis Error:', err);
    });
    this.publisher.on('error', (err) => {
      console.error('[SharedMemory] Publisher Redis Error:', err);
    });
    this.stateStore.on('error', (err) => {
      console.error('[SharedMemory] StateStore Redis Error:', err);
    });
  }

  async publish(channel: string, message: string): Promise<number> {
    console.log(`[SharedMemory] Publishing to channel ${channel}: ${message}`);
    return this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    console.log(`[SharedMemory] Subscribing to channel ${channel}`);
    this.subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`[SharedMemory] Failed to subscribe to ${channel}:`, err);
      } else {
        console.log(`[SharedMemory] Successfully subscribed to ${channel}`);
      }
    });
    // Store callback for later use if needed, or directly use the 'message' event listener
    // For simplicity, this example assumes a single callback per channel or handles it internally.
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  async setSharedState(key: string, value: string): Promise<string | null> {
    console.log(`[SharedMemory] Setting shared state for key ${key}`);
    return this.stateStore.set(key, value);
  }

  async getSharedState(key: string): Promise<string | null> {
    console.log(`[SharedMemory] Getting shared state for key ${key}`);
    return this.stateStore.get(key);
  }

  async deleteSharedState(key: string): Promise<number> {
    console.log(`[SharedMemory] Deleting shared state for key ${key}`);
    return this.stateStore.del(key);
  }
}
