import * as os from 'os';
import axios from 'axios';
import { ServiceMetric, SystemMetric } from './metrics-collector';

export interface Alert {
  id: string;
  metricName: string;
  threshold: string;
  currentValue: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  serviceName?: string;
}

interface AlertThresholds {
  serviceDown?: boolean;
  responseTimeHigh?: number; // ms
  cpuUsageHigh?: number; // percentage
  memoryUsageHigh?: number; // percentage of total memory
}

export class AlertManager {
  private activeAlerts: Map<string, Alert> = new Map(); // Key: alertId
  private thresholds: AlertThresholds;
  private webhookUrl: string; // For Discord/Telegram webhook

  constructor(thresholds: AlertThresholds = {}, webhookUrl: string = process.env.ALERT_WEBHOOK_URL || '') {
    this.thresholds = thresholds;
    this.webhookUrl = webhookUrl;
    console.log('AlertManager initialized.');
  }

  public checkThresholds(metrics: { services: ServiceMetric[]; system: SystemMetric | null }): void {
    // Check service metrics
    for (const service of metrics.services) {
      if (this.thresholds.serviceDown && service.status === 'down') {
        this.sendAlert({
          id: `service-down-${service.serviceName}`,
          metricName: 'Service Status',
          threshold: 'Service is down',
          currentValue: service.status,
          severity: 'critical',
          message: `Service ${service.serviceName} is down. Error: ${service.error || 'N/A'}`,
          timestamp: Date.now(),
          acknowledged: false,
          serviceName: service.serviceName,
        });
      }
      if (this.thresholds.responseTimeHigh && service.responseTime && service.responseTime > this.thresholds.responseTimeHigh) {
        this.sendAlert({
          id: `response-time-high-${service.serviceName}`,
          metricName: 'Response Time',
          threshold: `>${this.thresholds.responseTimeHigh}ms`,
          currentValue: `${service.responseTime}ms`,
          severity: 'warning',
          message: `Service ${service.serviceName} response time is high: ${service.responseTime}ms`,
          timestamp: Date.now(),
          acknowledged: false,
          serviceName: service.serviceName,
        });
      }
    }

    // Check system metrics
    if (metrics.system) {
      const totalMemory = os.totalmem();
      const usedMemoryPercentage = (metrics.system.memoryUsage.rss / totalMemory) * 100;
      if (this.thresholds.memoryUsageHigh && usedMemoryPercentage > this.thresholds.memoryUsageHigh) {
        this.sendAlert({
          id: 'system-memory-high',
          metricName: 'System Memory Usage',
          threshold: `>${this.thresholds.memoryUsageHigh}%`,
          currentValue: `${usedMemoryPercentage.toFixed(2)}%`,
          severity: 'critical',
          message: `System memory usage is high: ${usedMemoryPercentage.toFixed(2)}%`,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }
      // Basic CPU check (more advanced would involve calculating average over time)
      const totalIdle = metrics.system.cpuUsage.map(cpu => cpu.times.idle).reduce((acc: number, val: number) => acc + val, 0);
      const totalTick = metrics.system.cpuUsage.map(cpu => cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq).reduce((acc: number, val: number) => acc + val, 0);
      const cpuUsage = 100 - (100 * totalIdle / totalTick);

      if (this.thresholds.cpuUsageHigh && cpuUsage > this.thresholds.cpuUsageHigh) {
        this.sendAlert({
          id: 'system-cpu-high',
          metricName: 'System CPU Usage',
          threshold: `>${this.thresholds.cpuUsageHigh}%`,
          currentValue: `${cpuUsage.toFixed(2)}%`,
          severity: 'critical',
          message: `System CPU usage is high: ${cpuUsage.toFixed(2)}%`,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }
    }
  }

  private async sendAlert(alert: Alert): Promise<void> {
    if (this.activeAlerts.has(alert.id) && !this.activeAlerts.get(alert.id)?.acknowledged) {
      // Only send if it's a new alert or an unacknowledged recurring alert
      return;
    }

    this.activeAlerts.set(alert.id, alert);
    console.warn(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

    if (this.webhookUrl) {
      try {
        await axios.post(this.webhookUrl, {
          username: 'Agentic Skill AlertManager',
          embeds: [{
            title: `[${alert.severity.toUpperCase()}] ${alert.metricName}`,
            description: alert.message,
            color: this.getAlertColor(alert.severity),
            fields: [
              { name: 'Service', value: alert.serviceName || 'System', inline: true },
              { name: 'Threshold', value: alert.threshold, inline: true },
              { name: 'Current Value', value: alert.currentValue, inline: true },
              { name: 'Timestamp', value: new Date(alert.timestamp).toISOString(), inline: false },
            ],
          }],
        });
        console.log(`Alert ${alert.id} sent to webhook.`);
      } catch (error) {
        console.error(`Failed to send alert ${alert.id} to webhook:`, error);
      }
    }
  }

  private getAlertColor(severity: Alert['severity']): number {
    switch (severity) {
      case 'info': return 3447003; // Blue
      case 'warning': return 16776960; // Yellow
      case 'critical': return 15158332; // Red
      default: return 8355711; // Grey
    }
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.acknowledged);
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.activeAlerts.set(alertId, alert);
      console.log(`Alert ${alertId} acknowledged.`);
      return true;
    }
    return false;
  }
}
