import axios from 'axios';
import os from 'os';

export interface ServiceMetric {
  serviceName: string;
  status: 'up' | 'down' | 'unknown';
  lastCheck: number;
  responseTime?: number;
  error?: string;
}

export interface SystemMetric {
  cpuUsage: os.CpuInfo[];
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: number;
}

export class MetricsCollector {
  private serviceMetrics: Map<string, ServiceMetric> = new Map();
  private systemMetrics: SystemMetric | null = null;

  constructor() {
    console.log('MetricsCollector initialized.');
  }

  public async collectServiceMetrics(serviceName: string, url: string): Promise<ServiceMetric> {
    const metric: ServiceMetric = {
      serviceName,
      status: 'unknown',
      lastCheck: Date.now(),
    };

    try {
      const start = process.hrtime.bigint();
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      const end = process.hrtime.bigint();
      metric.responseTime = Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds

      if (response.status === 200 && response.data.status === 'ok') {
        metric.status = 'up';
      } else {
        metric.status = 'down';
        metric.error = `Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`;
      }
    } catch (error: any) {
      metric.status = 'down';
      metric.error = error.message;
    }
    this.serviceMetrics.set(serviceName, metric);
    console.log(`Collected metrics for ${serviceName}: ${metric.status}`);
    return metric;
  }

  public collectSystemMetrics(): SystemMetric {
    this.systemMetrics = {
      cpuUsage: os.cpus(),
      memoryUsage: process.memoryUsage(),
      uptime: os.uptime(),
      timestamp: Date.now(),
    };
    console.log('Collected system metrics.');
    return this.systemMetrics;
  }

  public getMetrics(): { services: ServiceMetric[]; system: SystemMetric | null } {
    return {
      services: Array.from(this.serviceMetrics.values()),
      system: this.systemMetrics,
    };
  }

  public getMetricsByService(serviceName: string): ServiceMetric | undefined {
    return this.serviceMetrics.get(serviceName);
  }
}
