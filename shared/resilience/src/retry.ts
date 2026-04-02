interface RetryOptions {
  maxRetries?: number;
  delay?: number; // initial delay in milliseconds
  backoffMultiplier?: number;
  retryableErrors?: (new (...args: any[]) => Error)[];
}

export class RetryHandler {
  private defaultOptions: Required<RetryOptions>;

  constructor(options?: RetryOptions) {
    this.defaultOptions = {
      maxRetries: options?.maxRetries || 3,
      delay: options?.delay || 1000, // 1 second
      backoffMultiplier: options?.backoffMultiplier || 2,
      retryableErrors: options?.retryableErrors || [],
    };
    console.log(`RetryHandler initialized with options: ${JSON.stringify(this.defaultOptions)}`);
  }

  public async withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
    const currentOptions = { ...this.defaultOptions, ...options };
    let retries = 0;
    let currentDelay = currentOptions.delay;

    while (retries <= currentOptions.maxRetries) {
      try {
        return await fn();
      } catch (error: any) {
        const isRetryable = currentOptions.retryableErrors.some(ErrorType => error instanceof ErrorType);
        if (retries < currentOptions.maxRetries && (isRetryable || currentOptions.retryableErrors.length === 0)) {
          console.warn(`Attempt ${retries + 1} failed. Retrying in ${currentDelay}ms. Error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= currentOptions.backoffMultiplier;
          retries++;
        } else {
          console.error(`All ${currentOptions.maxRetries + 1} retry attempts failed. Last error: ${error.message}`);
          throw error; // Re-throw the last error if retries are exhausted or error is not retryable
        }
      }
    }
    // This part should ideally not be reached if the loop condition is correct and an error is always thrown
    throw new Error("Unexpected error in retry logic.");
  }
}
