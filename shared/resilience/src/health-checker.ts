import axios from 'axios';

interface ServiceHealth {
  name: string;
  url: string;
  status: 'unknown' | 'healthy' | 'unhealthy';
  lastCheck: number;
  lastError?: string;
}

export class ServiceHealthChecker {
  private services: Map<string, ServiceHealth> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    console.log('ServiceHealthChecker initialized.');
  }

  public registerService(name: string, url: string): void {
    if (this.services.has(name)) {
      console.warn(`Service ${name} already registered. Updating URL.`);
    }
    this.services.set(name, {
      name,
      url,
      status: 'unknown',
      lastCheck: 0,
    });
    console.log(`Service ${name} registered for health checks at ${url}`);
  }

  public async checkService(name: string): Promise<ServiceHealth> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not registered.`);
    }

    try {
      const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
      if (response.status === 200 && response.data.status === 'ok') {
        service.status = 'healthy';
        service.lastError = undefined;
      } else {
        service.status = 'unhealthy';
        service.lastError = `Unexpected response status: ${response.status} or data: ${JSON.stringify(response.data)}`;
      }
    } catch (error: any) {
      service.status = 'unhealthy';
      service.lastError = error.message;
    }
    service.lastCheck = Date.now();
    this.services.set(name, service);
    console.log(`Health check for ${service.name}: ${service.status}`);
    return service;
  }

  public async checkAll(): Promise<ServiceHealth[]> {
    console.log('Performing health check for all registered services...');
    const results: ServiceHealth[] = [];
    for (const name of this.services.keys()) {
      results.push(await this.checkService(name));
    }
    return results;
  }

  public startPeriodicCheck(interval: number = 60000): void {
    if (this.intervalId) {
      console.warn('Periodic health check is already running.');
      return;
    }
    console.log(`Starting periodic health checks every ${interval / 1000} seconds.`);
    this.intervalId = setInterval(() => this.checkAll(), interval);
  }

  public stopPeriodicCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Periodic health check stopped.');
    }
  }

  public getStatus(): ServiceHealth[] {
    return Array.from(this.services.values());
  }
}
