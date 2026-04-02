import * as os from 'os';
import ejs from 'ejs';
import { ServiceMetric, SystemMetric } from './metrics-collector';
import { Alert } from './alerting';

export class Dashboard {
  constructor() {
    console.log('Dashboard generator initialized.');
  }

  public async generateDashboard(metrics: { services: ServiceMetric[]; system: SystemMetric | null }, alerts: Alert[]): Promise<string> {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentic Skill Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
        .container { max-width: 1200px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1, h2 { color: #0056b3; }
        .section { margin-bottom: 30px; padding: 15px; border: 1px solid #eee; border-radius: 5px; background-color: #fafafa; }
        .service-status { display: flex; flex-wrap: wrap; gap: 15px; }
        .service-card { border: 1px solid #ddd; border-radius: 5px; padding: 10px; width: 200px; text-align: center; background-color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .service-card.up { border-color: #28a745; background-color: #e6ffe6; }
        .service-card.down { border-color: #dc3545; background-color: #ffe6e6; }
        .service-card.unknown { border-color: #ffc107; background-color: #fff8e6; }
        .service-card h3 { margin-top: 0; font-size: 1.1em; }
        .service-card p { margin: 5px 0; font-size: 0.9em; }
        .alert-list { list-style: none; padding: 0; }
        .alert-item { background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 10px; margin-bottom: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
        .alert-item.critical { background-color: #f8d7da; border-left-color: #dc3545; }
        .alert-item.warning { background-color: #fff3cd; border-left-color: #ffc107; }
        .alert-item.info { background-color: #d1ecf1; border-left-color: #17a2b8; }
        .alert-item button { background-color: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
        .alert-item button:hover { background-color: #0056b3; }
        .system-metrics table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .system-metrics th, .system-metrics td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .system-metrics th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Agentic Skill System Dashboard</h1>
        <p>Last updated: <%= new Date().toLocaleString() %></p>

        <div class="section">
            <h2>Service Status</h2>
            <div class="service-status">
                <% if (metrics.services.length === 0) { %>
                    <p>No services registered for monitoring.</p>
                <% } else { %>
                    <% metrics.services.forEach(function(service){ %>
                        <div class="service-card <%= service.status %>">
                            <h3><%= service.serviceName %></h3>
                            <p>Status: <strong><%= service.status.toUpperCase() %></strong></p>
                            <p>Response Time: <%= service.responseTime ? service.responseTime.toFixed(2) + 'ms' : 'N/A' %></p>
                            <p>Last Check: <%= new Date(service.lastCheck).toLocaleTimeString() %></p>
                            <% if (service.error) { %><p style="color: red; font-size: 0.8em;">Error: <%= service.error %></p><% } %>
                        </div>
                    <% }); %>
                <% } %>
            </div>
        </div>

        <div class="section">
            <h2>Active Alerts</h2>
            <ul class="alert-list">
                <% if (alerts.length === 0) { %>
                    <p>No active alerts.</p>
                <% } else { %>
                    <% alerts.forEach(function(alert){ %>
                        <li class="alert-item <%= alert.severity %>">
                            <div>
                                <strong><%= alert.metricName %> (<%= alert.severity.toUpperCase() %>)</strong>: <%= alert.message %><br>
                                <span>Service: <%= alert.serviceName || 'System' %> | Threshold: <%= alert.threshold %> | Current: <%= alert.currentValue %></span>
                            </div>
                            <% if (!alert.acknowledged) { %>
                                <button onclick="acknowledgeAlert('<%= alert.id %>')">Acknowledge</button>
                            <% } else { %>
                                <span>Acknowledged</span>
                            <% } %>
                        </li>
                    <% }); %>
                <% } %>
            </ul>
        </div>

        <div class="section system-metrics">
            <h2>System Metrics</h2>
            <% if (metrics.system) { %>
                <table>
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>CPU Model</td><td><%= metrics.system.cpuUsage[0].model %></td></tr>
                    <tr><td>CPU Cores</td><td><%= metrics.system.cpuUsage.length %></td></tr>
                    <tr><td>Total Memory</td><td><%= (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) %> GB</td></tr>
                    <tr><td>Used Memory (RSS)</td><td><%= (metrics.system.memoryUsage.rss / (1024 * 1024)).toFixed(2) %> MB</td></tr>
                    <tr><td>System Uptime</td><td><%= (metrics.system.uptime / 3600).toFixed(2) %> hours</td></tr>
                    <tr><td>Last Collected</td><td><%= new Date(metrics.system.timestamp).toLocaleTimeString() %></td></tr>
                </table>
            <% } else { %>
                <p>System metrics not yet collected.</p>
            <% } %>
        </div>
    </div>

    <script>
        async function acknowledgeAlert(alertId) {
            if (confirm('Are you sure you want to acknowledge this alert?')) {
                try {
                    const response = await fetch(\"/alerts/\" + alertId + \"/acknowledge\", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                        alert('Alert acknowledged successfully!');
                        location.reload(); // Reload to update dashboard
                    } else {
                        const errorData = await response.json();
                        alert('Failed to acknowledge alert: ' + (errorData.message || response.statusText));
                    }
                } catch (error) {
                    console.error('Error acknowledging alert:', error);
                    alert('An error occurred while acknowledging the alert.');
                }
            }
        }
    </script>
</body>
</html>
    `;
    return ejs.render(template, { metrics, alerts, os });
  }
}
