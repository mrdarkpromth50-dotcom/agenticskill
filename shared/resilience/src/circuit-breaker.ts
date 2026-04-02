type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of consecutive failures before opening the circuit
  resetTimeout?: number; // Time in milliseconds before attempting to close the circuit (HALF_OPEN state)
  timeout?: number; // Timeout for the function execution itself
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(options?: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: options?.failureThreshold || 5,
      resetTimeout: options?.resetTimeout || 30000, // 30 seconds
      timeout: options?.timeout || 10000, // 10 seconds for function execution
    };
    console.log(`CircuitBreaker initialized with options: ${JSON.stringify(this.options)}`);
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.warn('CircuitBreaker: State changed to HALF_OPEN. Attempting to close.');
      } else {
        throw new Error('CircuitBreaker is OPEN. Service unavailable.');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('CircuitBreaker: Function timed out')), this.options.timeout))
      ]);

      if (this.state === 'HALF_OPEN') {
        this.reset();
        console.log('CircuitBreaker: State changed to CLOSED. Half-open test successful.');
      }
      this.failureCount = 0; // Reset failure count on success
      return result;
    } catch (error: any) {
      this.recordFailure(error);
      throw error;
    }
  }

  private recordFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.error(`CircuitBreaker: Failure recorded. Count: ${this.failureCount}. Error: ${error.message}`);

    if (this.failureCount >= this.options.failureThreshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      console.error(`CircuitBreaker: State changed to OPEN due to ${this.failureCount} consecutive failures.`);
    }
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log('CircuitBreaker: Reset to CLOSED state.');
  }

  public getState(): CircuitState {
    return this.state;
  }
}
