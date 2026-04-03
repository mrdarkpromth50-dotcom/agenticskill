import express from 'express';
import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.BRIDGE_PORT || '3016');
const AGENT_TOWN_URL = process.env.AGENT_TOWN_URL || 'http://localhost:3000';
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3014';
const CEO_AGENT_URL = process.env.CEO_AGENT_URL || 'http://localhost:3004';

// Discord channel IDs
const CHANNELS = {
  general: process.env.DISCORD_CHANNEL_GENERAL || '',
  agentStatus: process.env.DISCORD_CHANNEL_AGENT_STATUS || '',
  dailyStandup: process.env.DISCORD_CHANNEL_DAILY_STANDUP || '',
  systemLogs: process.env.DISCORD_CHANNEL_SYSTEM_LOGS || '',
  trendResearch: process.env.DISCORD_CHANNEL_TREND_RESEARCH || '',
  financeAlerts: process.env.DISCORD_CHANNEL_FINANCE_ALERTS || '',
  ceoCommands: process.env.DISCORD_CHANNEL_CEO_COMMANDS || '',
};

// Track connected agents
interface AgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'offline';
  currentTask?: string;
  lastSeen: number;
}

const agentStates: Map<string, AgentState> = new Map();

// WebSocket connection to Agent Town
let wsConnection: WebSocket | null = null;
let wsReconnectTimer: NodeJS.Timeout | null = null;

function connectToAgentTown(): void {
  const wsUrl = AGENT_TOWN_URL.replace('http', 'ws');
  console.log(`[Bridge] Connecting to Agent Town WebSocket: ${wsUrl}`);

  try {
    wsConnection = new WebSocket(wsUrl);

    wsConnection.on('open', () => {
      console.log('[Bridge] Connected to Agent Town WebSocket');
      sendToDiscord(CHANNELS.systemLogs, {
        title: '🌐 Agent Town Bridge Connected',
        description: 'Bridge service is now connected to Agent Town UI',
        color: 0x00ff00,
      });
    });

    wsConnection.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        handleAgentTownMessage(message);
      } catch (e) {
        console.log('[Bridge] Received non-JSON message:', data.toString().substring(0, 100));
      }
    });

    wsConnection.on('close', () => {
      console.log('[Bridge] WebSocket connection closed. Reconnecting in 10s...');
      wsConnection = null;
      wsReconnectTimer = setTimeout(connectToAgentTown, 10000);
    });

    wsConnection.on('error', (error: Error) => {
      console.error('[Bridge] WebSocket error:', error.message);
    });
  } catch (error: any) {
    console.error('[Bridge] Failed to connect to Agent Town:', error.message);
    wsReconnectTimer = setTimeout(connectToAgentTown, 10000);
  }
}

function handleAgentTownMessage(message: any): void {
  console.log('[Bridge] Agent Town message:', message.type || 'unknown');

  switch (message.type) {
    case 'agent_status':
      handleAgentStatus(message);
      break;
    case 'task_update':
      handleTaskUpdate(message);
      break;
    case 'chat_message':
      handleChatMessage(message);
      break;
    case 'system_event':
      handleSystemEvent(message);
      break;
    default:
      // Forward unknown messages to system logs
      if (message.type) {
        console.log(`[Bridge] Unknown message type: ${message.type}`);
      }
  }
}

async function handleAgentStatus(message: any): Promise<void> {
  const agent: AgentState = {
    id: message.agentId || 'unknown',
    name: message.agentName || 'Unknown Agent',
    role: message.role || 'worker',
    status: message.status || 'idle',
    currentTask: message.currentTask,
    lastSeen: Date.now(),
  };

  agentStates.set(agent.id, agent);

  await sendToDiscord(CHANNELS.agentStatus, {
    title: `🤖 ${agent.name} - ${agent.status.toUpperCase()}`,
    color: agent.status === 'working' ? 0x2ecc71 : agent.status === 'idle' ? 0x3498db : 0xe74c3c,
    fields: [
      { name: 'Role', value: agent.role, inline: true },
      { name: 'Status', value: agent.status, inline: true },
      { name: 'Task', value: agent.currentTask || 'None', inline: true },
    ],
  });
}

async function handleTaskUpdate(message: any): Promise<void> {
  await sendToDiscord(CHANNELS.agentStatus, {
    title: `📋 Task Update: ${message.taskId || 'Unknown'}`,
    description: message.description || 'Task status changed',
    color: message.status === 'completed' ? 0x2ecc71 : message.status === 'failed' ? 0xe74c3c : 0xf39c12,
    fields: [
      { name: 'Status', value: message.status || 'unknown', inline: true },
      { name: 'Agent', value: message.agentName || 'Unknown', inline: true },
    ],
  });
}

async function handleChatMessage(message: any): Promise<void> {
  const text = `**${message.senderName || 'Agent'}**: ${message.content || ''}`;
  await sendToDiscordText(CHANNELS.general, text);
}

async function handleSystemEvent(message: any): Promise<void> {
  await sendToDiscord(CHANNELS.systemLogs, {
    title: `⚙️ System Event: ${message.event || 'Unknown'}`,
    description: message.details || '',
    color: 0x95a5a6,
  });
}

// Send embed to Discord via Discord Bot HTTP API
async function sendToDiscord(channelId: string, embed: any): Promise<void> {
  if (!channelId) return;
  try {
    await axios.post(`${DISCORD_BOT_URL}/send`, {
      channelId,
      embed,
    }, { timeout: 5000 });
  } catch (error: any) {
    console.error(`[Bridge] Failed to send to Discord: ${error.message}`);
  }
}

async function sendToDiscordText(channelId: string, message: string): Promise<void> {
  if (!channelId) return;
  try {
    await axios.post(`${DISCORD_BOT_URL}/send`, {
      channelId,
      message,
    }, { timeout: 5000 });
  } catch (error: any) {
    console.error(`[Bridge] Failed to send text to Discord: ${error.message}`);
  }
}

// Express HTTP API
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'agent-town-bridge',
    agentTownConnected: wsConnection?.readyState === WebSocket.OPEN,
    activeAgents: agentStates.size,
    timestamp: Date.now(),
  });
});

// Get all agent states
app.get('/agents', (_req, res) => {
  const agents = Array.from(agentStates.values());
  res.json({ agents });
});

// Forward command from Discord to Agent Town
app.post('/command', async (req, res) => {
  const { command, sender } = req.body;
  if (wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      type: 'command',
      command,
      sender,
      timestamp: Date.now(),
    }));
    res.json({ success: true });
  } else {
    res.status(503).json({ error: 'Not connected to Agent Town' });
  }
});

// Send message to Agent Town chat
app.post('/chat', async (req, res) => {
  const { message, sender } = req.body;
  if (wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      type: 'chat',
      content: message,
      sender,
      timestamp: Date.now(),
    }));
    res.json({ success: true });
  } else {
    res.status(503).json({ error: 'Not connected to Agent Town' });
  }
});

// Trigger agent status broadcast to Discord
app.post('/broadcast-status', async (_req, res) => {
  const agents = Array.from(agentStates.values());
  const fields = agents.map(a => ({
    name: `${a.name} (${a.role})`,
    value: `${a.status === 'working' ? '🟢' : a.status === 'idle' ? '🔵' : '🔴'} ${a.status}${a.currentTask ? ` - ${a.currentTask}` : ''}`,
    inline: false,
  }));

  await sendToDiscord(CHANNELS.agentStatus, {
    title: '🏢 Agent Town Status Board',
    description: `${agents.length} agents registered`,
    color: 0x3498db,
    fields: fields.length > 0 ? fields : [{ name: 'No agents', value: 'No agents currently registered', inline: false }],
  });

  res.json({ success: true, agentCount: agents.length });
});

// Periodic status check - poll services and update Agent Town
async function pollServiceStatus(): Promise<void> {
  const services = [
    { name: 'CEO Agent', port: 3004, role: 'CEO' },
    { name: 'Accountant Agent', port: 3009, role: 'Accountant' },
    { name: 'CTO Agent', port: 3010, role: 'CTO' },
    { name: 'CMO Agent', port: 3011, role: 'CMO' },
    { name: 'CSO Agent', port: 3012, role: 'CSO' },
    { name: 'DevOps Agent', port: 3013, role: 'DevOps' },
  ];

  for (const svc of services) {
    try {
      const response = await axios.get(`http://localhost:${svc.port}/health`, { timeout: 2000, headers: { 'x-api-key': process.env.API_KEYS || 'dev-api-key-2026' } });
      agentStates.set(svc.name, {
        id: svc.name.toLowerCase().replace(/\s/g, '-'),
        name: svc.name,
        role: svc.role,
        status: response.data?.status === 'ok' ? 'idle' : 'offline',
        lastSeen: Date.now(),
      });
    } catch {
      agentStates.set(svc.name, {
        id: svc.name.toLowerCase().replace(/\s/g, '-'),
        name: svc.name,
        role: svc.role,
        status: 'offline',
        lastSeen: Date.now(),
      });
    }
  }
}

// Start the bridge
async function main(): Promise<void> {
  console.log('[Bridge] Starting Agent Town Bridge Service...');

  // Connect to Agent Town WebSocket
  connectToAgentTown();

  // Start polling service status every 60 seconds
  setInterval(pollServiceStatus, 60000);
  await pollServiceStatus(); // Initial poll

  app.listen(PORT, () => {
    console.log(`[Bridge] HTTP API listening on port ${PORT}`);
    console.log(`[Bridge] Agent Town URL: ${AGENT_TOWN_URL}`);
    console.log(`[Bridge] Discord Bot URL: ${DISCORD_BOT_URL}`);
  });
}

main().catch(error => {
  console.error('[Bridge] Failed to start:', error);
  process.exit(1);
});
