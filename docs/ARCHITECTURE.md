# Architecture and Integration Guide

## System Overview

AgenticSkill is a complete AI agent management system combining three powerful open-source tools:

```
┌────────────────────────────────────────────────────────────────┐
│                      User Interfaces                            │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │  Agent Town      │  │  OpenClaw CLI    │  │  Chat Apps  │  │
│  │  Pixel RPG       │  │  Web UI          │  │  25+ Channels│ │
│  │  (localhost:3000)│  │  (Dashboard)     │  │  (Telegram  │  │
│  │                  │  │                  │  │   Discord   │  │
│  │  - Task mgmt     │  │  - Settings      │  │   Slack etc)│  │
│  │  - Real-time viz │  │  - Model config  │  │             │  │
│  │  - Worker status │  │  - Logs          │  │             │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘  │
└───────────┼──────────────────────┼────────────────────┼─────────┘
            │                      │                    │
            │                      │                    │
       WebSocket                HTTP/WebSocket        HTTP/WebSocket
            │                      │                    │
            └──────────────────────┼────────────────────┘
                                   ▼
                 ┌──────────────────────────────────┐
                 │   OpenClaw Gateway               │
                 │  (Port 18789 - localhost)        │
                 │                                  │
                 │  - Multi-protocol handler        │
                 │  - Tool routing                  │
                 │  - Session management            │
                 │  - Model switching               │
                 │  - Context preservation          │
                 └────────────┬─────────────────────┘
                              │
                           HTTP/A PI
                              │
                 ┌────────────▼────────────────┐
                 │  Antigravity Claude Proxy   │
                 │  (Port 8080 - localhost)    │
                 │                             │
                 │  - Anthropic-compatible API │
                 │  - Model abstraction        │
                 │  - Account management       │
                 │  - Rate limiting            │
                 │  - Logging & analytics      │
                 └────────────┬────────────────┘
                              │
                        Google OAuth2
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ▼                                            ▼
    Google Cloud                              Google Accounts
    Claude API                                (Antigravity)
    Gemini API                                Gemini API Access
        │                                            │
        ├──────────────────┬──────────────────────────┤
        │                  │                          │
        ▼                  ▼                          ▼
    Claude 3.5        Gemini 3 Flash         Claude Sonnet 4.6
    Sonnet            (Streaming)            (Thinking)
```

---

## Component Details

### 1. Agent Town (Frontend)
**Purpose:** Visual management interface for AI agents
**Technology:** Next.js + React + Phaser 3 (pixel art game engine)
**Port:** 3000

#### Key Features:
- RPG-style office interface
- Real-time task assignment
- Worker status visualization
- Live streaming tool execution
- Multiple sessions support

#### Communication Flow:
```
User Actions (UI) 
    ↓
React Component
    ↓
WebSocket → OpenClaw Gateway
    ↓
Task Queuing
    ↓
Agent Execution
    ↓
Status Update → WebSocket → UI Update
```

### 2. OpenClaw Gateway (Hub)
**Purpose:** Central routing and orchestration
**Technology:** Node.js TypeScript
**Port:** 18789 (WebSocket)

#### Key Responsibilities:
- **Protocol Translation:** HTTP/WebSocket to internal format
- **Multi-channel Routing:** Direct messages to correct agents
- **Session Management:** Context and token tracking
- **Tool Invocation:** Browser, Canvas, Cron, etc.
- **Model Abstraction:** Switch between providers seamlessly

#### Request Flow:
```
Incoming Request (HTTP/WS)
    ↓
Authentication & Pairing
    ↓
Session Lookup
    ↓
Model Provider Selection
    ↓
Forward to API (Antigravity Proxy)
    ↓
Stream Response Back
```

### 3. Antigravity Claude Proxy (API Layer)
**Purpose:** Unified AI model proxy
**Technology:** Node.js
**Port:** 8080

#### Key Capabilities:
- **Account Management:** Multiple Google accounts
- **API Compatibility:** Anthropic-compatible interface
- **Model Support:**
  - Claude 3.5 Sonnet
  - Claude Sonnet 4.6 (Thinking)
  - Gemini 3 Flash
  - Gemini 2 (Pro)

#### Authentication:
```
User Request
    ↓
Proxy Receives (localhost:8080)
    ↓
Account Selection (round-robin or specified)
    ↓
Google OAuth Token Refresh
    ↓
Forward to Claude/Gemini API
    ↓
Response Parsing & Caching
    ↓
Return to Caller
```

---

## Data Flow Examples

### Example 1: Simple Message in Agent Town

```
1. User types message in chat UI
   └─> "Hello, assign John to write a report"

2. Agent Town sends via WebSocket
   └─> ws://localhost:18789/
   └─> { type: "message", content: "...", sessionId: "...", workerId: 123 }

3. OpenClaw receives & routes
   └─> Finds Worker #123
   └─> Creates task
   └─> Selects model (Antigravity Proxy)

4. Antigravity Proxy
   └─> Formats as Anthropic API call
   └─> Selects Google account
   └─> Sends to Claude API

5. Claude processes
   └─> Returns streaming response

6. Response flows back:
   OpenClaw → Agent Town → UI displays in chat
```

### Example 2: Tool Invocation (Browser)

```
1. Agent needs to browse web
   └─> Request: "Visit https://example.com"

2. OpenClaw detects tool call
   └─> Tool: "browser"
   └─> Action: "navigate"

3. Tool execution
   └─> Browser automation runs
   └─> Content captured
   └─> Screenshot/HTML returned

4. Result fed back to agent
   └─> Agent continues processing
   └─> Response sent to user
```

---

## Configuration Files

### ~/.openclaw/openclaw.json
Defines model providers and channels:

```json
{
  "models": {
    "providers": {
      "antigravity-proxy": {
        "baseUrl": "http://127.0.0.1:8080",
        "api": "anthropic-messages"
      }
    }
  },
  "channels": {
    "discord": { "enabled": true, "token": "..." },
    "slack": { "enabled": true, "token": "..." }
  }
}
```

### Environment Variables (.env)
Fine-tune settings:

```env
PROXY_HOST=127.0.0.1
PROXY_PORT=8080
OPENCLAW_PORT=18789
AGENT_TOWN_PORT=3000
OPENCLAW_VERBOSE=true
```

---

## Integration Patterns

### Pattern 1: Local Development
All services on localhost, direct communication:
```
Browser: localhost:3000 (Agent Town)
         localhost:8080 (Proxy Dashboard)
         
WebSocket: ws://localhost:18789 (OpenClaw)
```

### Pattern 2: Docker Deployment
Services in containers, internal Docker network:
```
antigravity-proxy → 0.0.0.0:8080
openclaw:18789 (internal)
agent-town → 0.0.0.0:3000
```

### Pattern 3: Distributed Setup
Services on different machines:
```
Agent Town: machine-a:3000
OpenClaw: machine-b:18789
Proxy: machine-c:8080 (with firewall restrictions)
```

---

## Performance Considerations

### Resource Usage
| Component | CPU | RAM | Disk |
|-----------|-----|-----|------|
| Antigravity Proxy | Low | 200MB | 50MB |
| OpenClaw | Medium | 300MB | 100MB |
| Agent Town | Low | 150MB | 50MB |
| **Total** | **Medium** | **~700MB** | **~200MB** |

### Scaling Strategies

1. **Multiple Proxy Instances**
   - Load balance across instances
   - Separate Google accounts per instance
   - Better quota utilization

2. **Openclaw Clustering**
   - Central session store (Redis)
   - Multiple gateway instances
   - Distributed task queues

3. **Agent Town Redundancy**
   - Stateless frontend
   - Can run multiple instances
   - Share OpenClaw gateway

---

## Security Architecture

### 1. Authentication
```
OpenClaw: DM-based pairing
├─ Secure handshake
├─ Token exchange
└─ Approval workflow

Antigravity: API Key
├─ Fixed token ("test" by default)
├─ Localhost-only by default
└─ Can restrict to VPN/firewall
```

### 2. Authorization
```
Per-session access control
├─ User/session identification
├─ Tool permission matrix
└─ Rate limiting per session
```

### 3. Data Protection
```
Encryption in transit:
├─ HTTPS for API calls
├─ WSS for WebSocket (optional)
└─ Local storage only (no cloud sync)
```

---

## Troubleshooting Guide

### Debug Mode
```bash
# Verbose logging
OPENCLAW_VERBOSE=true openclaw gateway --port 18789

# Proxy debugging
VERBOSE=true antigravity-claude-proxy start
```

### Connection Issues
```bash
# Test connectivity
curl http://localhost:8080/health
curl http://localhost:18789/health

# WebSocket test
wscat -c ws://localhost:18789/
```

### Log Locations
```
Proxy logs: ~/.antigravity/logs/
OpenClaw logs: ~/.openclaw/logs/
Agent Town: Browser console
```

---

## Extended Documentation

For more details, see:
- `INSTALLATION.md` - Setup guide
- `USAGE.md` - Day-to-day operations
- Individual project wikis (linked in README)
