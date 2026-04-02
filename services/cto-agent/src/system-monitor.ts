import axios from 'axios';
import { SystemError } from './types';

interface ServiceConfig {
  name: string;
  url: string;
}

export class SystemMonitor {
  private servicesToMonitor: ServiceConfig[];
  private errorLogs: SystemError[] = [];

  constructor(servicesToMonitor: ServiceConfig[]) {
    this.servicesToMonitor = servicesToMonitor;
  }

  public startMonitoring(interval: number, onNewError: (error: SystemError) => void): void {
    console.log('System Monitor: Starting system monitoring...');
    setInterval(async () => {
      try {
        await this.checkServiceHealth();
        const newErrors = await this.collectLogs();
        newErrors.forEach(onNewError);
        this.detectAnomalies();
      } catch (error) {
        console.error('System Monitor: Error during monitoring loop:', error);
      }
    }, interval);
  }

  public async checkServiceHealth(): Promise<void> {
    console.log('System Monitor: Checking service health...');
    for (const service of this.servicesToMonitor) {
      try {
        const response = await axios.get(`${service.url}/health`);
        if (response.status === 200 && response.data.status === 'ok') {
          // console.log(`Service ${service.name} is healthy.`);
        } else {
          console.warn(`Service ${service.name} is unhealthy:`, response.data);
          // Potentially generate a SystemError here
        }
      } catch (error) {
        console.error(`Service ${service.name} is down or unreachable:`, error instanceof Error ? error.message : String(error));
        // Generate a critical SystemError
        this.errorLogs.push({
          id: `err-${Date.now()}-${service.name}`,
          service: service.name,
          message: `Service ${service.name} is down or unreachable.`,
          level: 'critical',
          timestamp: Date.now(),
          details: { error: error instanceof Error ? error.message : String(error) },
          status: 'new',
        });
      }
    }
  }

  public async collectLogs(): Promise<SystemError[]> {
    // Placeholder for actual log collection logic (e.g., from a centralized logging system like ELK, Splunk)
    // For now, simulate some errors
    const newErrors: SystemError[] = [];
    if (Math.random() < 0.05) { // 5% chance of a new error
      const randomService = this.servicesToMonitor[Math.floor(Math.random() * this.servicesToMonitor.length)];
      const error: SystemError = {
        id: `err-${Date.now()}-${randomService.name}`,
        service: randomService.name,
        message: `Simulated error in ${randomService.name}: Something went wrong!`,
        level: Math.random() < 0.3 ? 'critical' : 'error',
        timestamp: Date.now(),
        details: { code: 'ERR_SIMULATED', stack: '...' },
        status: 'new',
      };
      this.errorLogs.push(error);
      newErrors.push(error);
    }
    return newErrors;
  }

  public detectAnomalies(): void {
    // Placeholder for actual anomaly detection logic
    // This would typically involve analyzing metrics over time, log patterns, etc.
    // console.log('System Monitor: Detecting anomalies...');
  }

  public getErrorLogs(): SystemError[] {
    return this.errorLogs;
  }

  public clearErrorLogs(): void {
    this.errorLogs = [];
  }
}
