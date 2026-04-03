import express from 'express';
import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// Configuration
// ============================================================
const PORT = parseInt(process.env.BRIDGE_PORT || '3016');
const AGENT_TOWN_URL = process.env.AGENT_TOWN_URL || 'http://localhost:3000';
const DISCORD_BOT_URL = process.env.DISCORD_BOT_URL || 'http://localhost:3014';
const CEO_AGENT_URL = process.env.CEO_AGENT_URL || 'http://localhost:3004';
const MEMORY_SYSTEM_URL = process.env.MEMORY_SYSTEM_URL || 'http://localhost:3001';
const AGENT_ID = 'agent-town-bridge';

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

// ============================================================
// Memory HTTP Client
// ============================================================
function createMemoryHttp() {
  const apiKey = (process.env.API_KEYS || '').split(',')[0] || '';
  return axios.create({
    baseURL: MEMORY_SYSTEM_URL,
    timeout: 8000,
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  });
}
const memoryHttp = createMemoryHttp();

// Redis TTL constants (seconds)
const TTL_AGENT_STATE = 300;          // 5 minutes
const TTL_STATUS_HISTORY = 86400;     // 24 hours

// ============================================================
// Persistent Storage Helpers
// ============================================================

/** Simple hash-based embedding (128 dimensions) */
function generateSimpleEmbedding(text: string): number[] {
  const dim = 128;
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const idx = (i * 7 + c * 13) % dim;
    vec[idx] = (vec[idx] + c / 255) % 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

/** Persist all agent states to Redis */
async function persistAgentStates(): Promise<void> {
  try {
    const statesArray = Array.from(agentStates.values());
    await memoryHttp.post('/memory/short-term', {
      agentId: AGENT_ID,
      key: 'all_agent_states',
      value: JSON.stringify(statesArray),
      ttl: TTL_AGENT_STATE,
    });
  } catch (err: any) {
    // Non-fatal
  }
}

/** Restore agent states from Redis on startup */
async function restoreAgentStates(): Promise<void> {
  try {
    const response = await memoryHttp.get(`/memory/short-term/${AGENT_ID}/all_agent_states`);
    if (response?.data?.value) {
      const saved: AgentState[] = JSON.parse(response.data.value);
      for (const agent of saved) {
        // Mark all restored agents as offline until re-confirmed
        agentStates.set(agent.name, { ...agent, status: 'offline' });
      }
      console.log(`[Bridge] Restored ${saved.length} agent states from Redis`);
    }
  } catch {
    console.log('[Bridge] No previous agent states found in Redis');
  }
}

/** Archive agent status event to ChromaDB (long-term memory) */
async function archiveStatusEvent(agent: AgentState, event: string): Promise<void> {
  try {
    const document = `Agent Status Event: ${event}\n` +
      `Agent: ${agent.name} (${agent.role})\n` +
      `Status: ${agent.status}\n` +
      `Task: ${agent.currentTask || 'None'}\n` +
      `Timestamp: ${new Date().toISOString()}`;

    const embedding = generateSimpleEmbedding(document);

    await memoryHttp.post('/memory/long-term', {
      agentId: AGENT_ID,
      document,
      embedding,
      metadata: {
        type: 'agent_status_event',
        agentName: agent.name,
        agentRole: agent.role,
        status: agent.status,
        event,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Non-fatal
  }
}

/** Update shared state with current bridge status */
async function updateSharedBridgeStatus(): Promise<void> {
  try {
    const agents = Array.from(agentStates.values());
    const onlineCount = agents.filter(a => a.status !== 'offline').length;
    await memoryHttp.post('/memory/shared/bridge-status', {
      value: JSON.stringify({
        agentTownConnected: wsConnection?.readyState === WebSocket.OPEN,
        totalAgents: agents.length,
        onlineAgents: onlineCount,
        offlineAgents: agents.length - onlineCount,
        updatedAt: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal
  }
}

/** Publish bridge activity to shared channel */
async function publishActivity(activity: string): Promise<void> {
  try {
    await memoryHttp.post('/memory/shared/publish', {
      channel: 'bridge-activities',
      message: JSON.stringify({
        agentId: AGENT_ID,
        activity,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal
  }
}

// ============================================================
// Agent State Management
// ============================================================

interface AgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'offline';
  currentTask?: string;
  lastSeen: number;
}

const agentStates: Map<string, AgentState> = new Map();

// ============================================================
// WebSocket Connection to Agent Town
// ============================================================

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
      publishActivity('Connected to Agent Town WebSocket');
      updateSharedBridgeStatus();
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
      updateSharedBridgeStatus();
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

  const previousState = agentStates.get(agent.name);
  agentStates.set(agent.name, agent);

  // Persist to Redis
  await persistAgentStates();

  // Archive status change events to ChromaDB
  if (!previousState || previousState.status !== agent.status) {
    await archiveStatusEvent(agent, `Status changed from ${previousState?.status || 'unknown'} to ${agent.status}`);
  }

  await updateSharedBridgeStatus();

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

  // Archive task update to ChromaDB
  const fakeAgent: AgentState = {
    id: message.agentId || 'unknown',
    name: message.agentName || 'Unknown',
    role: 'worker',
    status: message.status === 'completed' ? 'idle' : 'working',
    currentTask: message.description,
    lastSeen: Date.now(),
  };
  await archiveStatusEvent(fakeAgent, `Task ${message.taskId} ${message.status}`);
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

// ============================================================
// Discord Communication
// ============================================================

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

// ============================================================
// Express HTTP API
// ============================================================

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

// Get bridge status from shared memory
app.get('/status', async (_req, res) => {
  try {
    const response = await memoryHttp.get(`/memory/shared/bridge-status`);
    res.json(response.data);
  } catch {
    res.json({
      agentTownConnected: wsConnection?.readyState === WebSocket.OPEN,
      totalAgents: agentStates.size,
      updatedAt: new Date().toISOString(),
    });
  }
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
    await publishActivity(`Command forwarded from ${sender}: ${command?.substring(0, 50)}`);
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
    description: `${agents.length} agents registered | Memory: Redis ✅ | ChromaDB ✅`,
    color: 0x3498db,
    fields: fields.length > 0 ? fields : [{ name: 'No agents', value: 'No agents currently registered', inline: false }],
  });

  res.json({ success: true, agentCount: agents.length });
});

// ============================================================
// Service Status Polling
// ============================================================

async function pollServiceStatus(): Promise<void> {
  const services = [
    { name: 'CEO Agent', port: 3004, role: 'CEO' },
    { name: 'Accountant Agent', port: 3009, role: 'Accountant' },
    { name: 'CTO Agent', port: 3010, role: 'CTO' },
    { name: 'CMO Agent', port: 3011, role: 'CMO' },
    { name: 'CSO Agent', port: 3012, role: 'CSO' },
    { name: 'DevOps Agent', port: 3013, role: 'DevOps' },
    { name: 'Memory System', port: 3001, role: 'Infrastructure' },
    { name: 'Discord Bot', port: 3014, role: 'Communication' },
    { name: 'Telegram Bot', port: 3015, role: 'Communication' },
  ];

  let onlineCount = 0;
  let offlineCount = 0;

  for (const svc of services) {
    try {
      const response = await axios.get(`http://localhost:${svc.port}/health`, {
        timeout: 2000,
        headers: { 'x-api-key': process.env.API_KEYS || 'dev-api-key-2026' },
      });
      const prevState = agentStates.get(svc.name);
      const newStatus = response.data?.status === 'ok' ? 'idle' : 'offline';
      
      agentStates.set(svc.name, {
        id: svc.name.toLowerCase().replace(/\s/g, '-'),
        name: svc.name,
        role: svc.role,
        status: newStatus,
        lastSeen: Date.now(),
      });

      // Archive status change to ChromaDB
      if (prevState?.status !== newStatus) {
        await archiveStatusEvent(agentStates.get(svc.name)!, `Service came online`);
      }
      onlineCount++;
    } catch {
      const prevState = agentStates.get(svc.name);
      agentStates.set(svc.name, {
        id: svc.name.toLowerCase().replace(/\s/g, '-'),
        name: svc.name,
        role: svc.role,
        status: 'offline',
        lastSeen: Date.now(),
      });

      // Archive offline event to ChromaDB
      if (prevState?.status !== 'offline') {
        await archiveStatusEvent(agentStates.get(svc.name)!, `Service went offline`);
      }
      offlineCount++;
    }
  }

  // Persist all states to Redis
  await persistAgentStates();
  await updateSharedBridgeStatus();

  console.log(`[Bridge] Status poll: ${onlineCount} online, ${offlineCount} offline`);
}

// ============================================================
// Main Entry Point
// ============================================================

async function main(): Promise<void> {
  console.log('[Bridge] Starting Agent Town Bridge Service...');

  // Restore previous agent states from Redis
  await restoreAgentStates();

  // Connect to Agent Town WebSocket
  connectToAgentTown();

  // Initial status poll
  await pollServiceStatus();

  // Start polling service status every 60 seconds
  setInterval(pollServiceStatus, 60000);

  // Publish startup activity
  await publishActivity('Agent Town Bridge started');

  app.listen(PORT, () => {
    console.log(`[Bridge] HTTP API listening on port ${PORT}`);
    console.log(`[Bridge] Agent Town URL: ${AGENT_TOWN_URL}`);
    console.log(`[Bridge] Discord Bot URL: ${DISCORD_BOT_URL}`);
    console.log(`[Bridge] Memory System URL: ${MEMORY_SYSTEM_URL}`);
  });
}

main().catch(error => {
  console.error('[Bridge] Failed to start:', error);
  process.exit(1);
});
